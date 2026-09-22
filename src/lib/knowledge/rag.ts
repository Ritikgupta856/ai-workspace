import { randomUUID } from "node:crypto"

import { google } from "@ai-sdk/google"
import { embed, embedMany } from "ai"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"

import type { KnowledgeSource } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * The whole RAG pipeline, in the order data actually moves through it:
 * extract → normalize → chunk → embed → store, then (separately, at query
 * time) retrieve. Kept in one file so the pipeline can be read and redesigned
 * as a whole instead of jumping across four files that only ever had one
 * caller each.
 *
 * Three invariants hold this together. Breaking one of them degrades the
 * agent's answers quietly rather than loudly, so they are worth knowing before
 * changing anything here:
 *
 *  1. EMBEDDING_DIMENSIONS must equal the width of KnowledgeChunk.embedding in
 *     Postgres. Both are vector(1536), and prisma/schema.prisma now declares the
 *     same. Change one, change all three, and re-embed everything: vectors of
 *     different widths are not comparable, and Postgres rejects the insert
 *     outright.
 *  2. Documents are embedded with taskType RETRIEVAL_DOCUMENT, queries with
 *     RETRIEVAL_QUERY. Gemini deliberately projects the two sides differently;
 *     embedding a question as if it were a passage measurably worsens ranking.
 *  3. What gets embedded is not what gets stored. The vector is built from the
 *     chunk plus its document title and section heading, so a passage that says
 *     "it was rejected twice" is still findable; `content` stays the raw passage
 *     so the agent quotes the source rather than our scaffolding.
 */

// ── Configuration ───────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "gemini-embedding-001"

/** Must match the live `vector(1536)` on KnowledgeChunk.embedding. See invariant 1. */
const EMBEDDING_DIMENSIONS = 1536

/** Gemini caps a batch embed request; stay comfortably under it. */
const EMBED_BATCH_SIZE = 96

/** gemini-embedding-001 accepts ~2k tokens per input. This is the backstop. */
const MAX_EMBED_INPUT_CHARS = 6_000

const CHUNK_TARGET_CHARS = 1_800
const CHUNK_OVERLAP_CHARS = 200
const CHUNK_MIN_CHARS = 120
const CHUNK_MAX_CHARS = 2_400

/** A runaway file should cost a bounded number of embedding calls. */
const MAX_DOCUMENT_CHARS = 1_000_000

/** 9 bound parameters per row; keeps statements far below Postgres' 65535. */
const INSERT_BATCH_SIZE = 200

const DEFAULT_LIMIT = 5
const CANDIDATE_MULTIPLIER = 4

/**
 * Gemini cosine scores sit in a narrow, high band — they are not calibrated
 * probabilities. Measured against this schema with gemini-embedding-001 at
 * 1536 dims, off-topic queries ("sourdough hydration ratio" against a vendor
 * contract) land at 0.47–0.53, while genuinely relevant ones land at
 * 0.59–0.64. A floor of, say, 0.35 therefore filters nothing at all, which is
 * how five unrelated passages end up in the prompt.
 *
 * 0.50 sits below every relevant hit observed and above most noise, leaning
 * towards recall: a weak excerpt the agent can ignore beats a missing one it
 * cannot. 0.55 sits in the middle of the measured gap if precision matters
 * more. The gap is narrow, so treat this as a tuned default rather than a law —
 * the durable fix for the overlap is a reranking pass, not a better constant.
 */
const DEFAULT_MIN_SIMILARITY = 0.5

/**
 * Also drop anything far weaker than the best hit for this query. Absolute
 * floors cannot adapt to a query that simply scores low across the board;
 * this trims the long tail once a strong match exists.
 */
const DEFAULT_RELATIVE_RATIO = 0.85
const RRF_K = 60
const VECTOR_WEIGHT = 1
const TEXT_WEIGHT = 0.6
const TEXT_SEARCH_CONFIG = "english"

function log(message: string): void {
  console.log(`[RAG] ${message}`)
}

function warn(message: string, error?: unknown): void {
  if (error === undefined) console.warn(`[RAG] ${message}`)
  else console.warn(`[RAG] ${message}`, error)
}

export class UnsupportedFileTypeError extends Error {
  constructor(mediaType: string, filename: string) {
    super(`Unsupported file format: ${mediaType || "unknown type"} (${filename})`)
    this.name = "UnsupportedFileTypeError"
  }
}

// ── Step 1: Extract text from an uploaded file ─────────────────────────────

type DocumentFormat = "pdf" | "docx" | "html" | "text"

const PLAIN_TEXT_MEDIA_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/csv",
])

const PLAIN_TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "mdx",
  "csv",
  "tsv",
  "json",
  "log",
  "yml",
  "yaml",
])

function detectFormat(mediaType: string, filename: string): DocumentFormat | null {
  const type = mediaType?.toLowerCase().split(";")[0].trim() ?? ""
  const extension = filename.split(".").pop()?.toLowerCase() ?? ""

  if (type === "application/pdf" || extension === "pdf") return "pdf"

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx"
  ) {
    return "docx"
  }

  if (type === "text/html" || extension === "html" || extension === "htm") return "html"

  if (PLAIN_TEXT_MEDIA_TYPES.has(type) || PLAIN_TEXT_EXTENSIONS.has(extension)) return "text"

  // Anything else that announces itself as text is worth a try — better to
  // index a slightly messy .rst than to reject it.
  if (type.startsWith("text/")) return "text"

  return null
}

/**
 * Whether this pipeline can read the file at all. Worth calling at the upload
 * boundary so a rejected file fails fast with a 415 instead of being stored
 * and then failing invisibly in the background.
 */
export function isSupportedDocument(mediaType: string, filename: string): boolean {
  return detectFormat(mediaType, filename) !== null
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|section|article|li|tr|h[1-6])>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "’")
}

export async function extractTextFromFile(
  buffer: Buffer,
  mediaType: string,
  filename: string
): Promise<string> {
  const format = detectFormat(mediaType, filename)

  switch (format) {
    case "pdf": {
      const parser = new PDFParse({ data: buffer })
      try {
        const result = await parser.getText()
        return result.text || ""
      } finally {
        // destroy() releases the worker; skipping it leaks across uploads.
        await parser.destroy()
      }
    }

    case "docx": {
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    }

    case "html":
      return stripHtml(buffer.toString("utf-8"))

    case "text":
      return buffer.toString("utf-8")

    default:
      throw new UnsupportedFileTypeError(mediaType, filename)
  }
}

// ── Step 2: Normalize and chunk the extracted text ─────────────────────────

export interface Chunk {
  content: string
  chunkIndex: number
  /** Nearest preceding heading, carried into the embedding for context. */
  heading: string | null
  charCount: number
}

/**
 * PDF and DOCX extraction routinely emits things Postgres will not store: NUL
 * bytes abort the insert with an encoding error, and unpaired surrogates do the
 * same. Layout-driven space runs and blank-line pile-ups are harmless but cost
 * tokens and blur chunk boundaries, so they go too.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/[​-‍﻿]/g, "")
    .replace(/ {3,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const MARKDOWN_HEADING = /^#{1,6}\s+(.{1,120})$/
const NUMBERED_HEADING = /^\d+(?:\.\d+)*[.)]?\s+\S.{0,110}$/

function detectHeading(block: string): string | null {
  const line = block.trim()
  if (!line || line.includes("\n") || line.length > 120) return null

  const markdown = line.match(MARKDOWN_HEADING)
  if (markdown) return markdown[1].trim()

  // A line that ends like a sentence is a sentence, not a heading.
  if (/[.!?,;:]$/.test(line)) return null

  if (NUMBERED_HEADING.test(line)) return line
  if (line.length >= 3 && /[A-Z]/.test(line) && line === line.toUpperCase()) return line

  return null
}

/** Last `maxChars` of text, advanced forward to a clean sentence or word edge. */
function takeTail(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text.trim()

  const tail = text.slice(-maxChars)
  const sentence = tail.match(/[.!?]\s+/)
  if (sentence?.index !== undefined) {
    return tail.slice(sentence.index + sentence[0].length).trim()
  }

  const space = tail.indexOf(" ")
  return (space === -1 ? tail : tail.slice(space + 1)).trim()
}

function splitByWords(text: string, target: number): string[] {
  const pieces: string[] = []
  let current = ""

  for (const word of text.split(/\s+/)) {
    // A single token longer than a whole chunk (base64, minified blobs) is the
    // one case where cutting mid-"word" is the right answer.
    if (word.length > target) {
      if (current) {
        pieces.push(current)
        current = ""
      }
      for (let i = 0; i < word.length; i += target) pieces.push(word.slice(i, i + target))
      continue
    }

    if (current && current.length + word.length + 1 > target) {
      pieces.push(current)
      current = ""
    }
    current = current ? `${current} ${word}` : word
  }

  if (current) pieces.push(current)
  return pieces
}

function splitLongBlock(block: string, target: number): string[] {
  const pieces: string[] = []
  let current = ""

  for (const sentence of block.split(/(?<=[.!?])\s+/)) {
    const units = sentence.length > target ? splitByWords(sentence, target) : [sentence]

    for (const unit of units) {
      if (current && current.length + unit.length + 1 > target) {
        pieces.push(current.trim())
        current = ""
      }
      current = current ? `${current} ${unit}` : unit
    }
  }

  if (current.trim()) pieces.push(current.trim())
  return pieces
}

/**
 * Structure-aware splitting: paragraphs first, then sentences, then words, and
 * only then a hard cut. Blind character slicing severs words and sentences
 * mid-thought, and a chunk that begins "…ation was denied because" embeds into
 * roughly nothing — it is the single cheapest retrieval-quality bug to fix.
 *
 * Consecutive chunks overlap by ~`overlapChars` so an answer that straddles a
 * boundary survives whole in at least one of them.
 */
export function chunkText(
  text: string,
  options?: { targetChars?: number; overlapChars?: number; minChars?: number }
): Chunk[] {
  const target = options?.targetChars ?? CHUNK_TARGET_CHARS
  const overlap = options?.overlapChars ?? CHUNK_OVERLAP_CHARS
  const minChars = options?.minChars ?? CHUNK_MIN_CHARS

  const normalized = normalizeText(text)
  if (!normalized) return []

  const chunks: Chunk[] = []
  let buffer: string[] = []
  let bufferLength = 0
  let heading: string | null = null
  let chunkHeading: string | null = null

  const flush = (): string | null => {
    const content = buffer.join("\n\n").trim()
    buffer = []
    bufferLength = 0
    if (!content) return null

    // A trailing runt gets folded back rather than dropped — losing the tail of
    // a document is how "the contract says X" becomes unanswerable.
    const previous = chunks[chunks.length - 1]
    if (
      previous &&
      content.length < minChars &&
      previous.content.length + content.length + 2 <= CHUNK_MAX_CHARS
    ) {
      previous.content = `${previous.content}\n\n${content}`
      previous.charCount = previous.content.length
      return previous.content
    }

    chunks.push({
      content,
      chunkIndex: chunks.length,
      heading: chunkHeading,
      charCount: content.length,
    })
    return content
  }

  const seedOverlap = (previous: string): void => {
    if (overlap <= 0) return
    const tail = takeTail(previous, overlap)
    if (!tail) return
    chunkHeading = heading
    buffer.push(tail)
    bufferLength = tail.length + 2
  }

  const append = (piece: string): void => {
    if (bufferLength === 0) chunkHeading = heading
    buffer.push(piece)
    bufferLength += piece.length + 2
  }

  for (const rawBlock of normalized.split(/\n{2,}/)) {
    const block = rawBlock.trim()
    if (!block) continue

    const detected = detectHeading(block)
    if (detected) heading = detected

    for (const piece of block.length > target ? splitLongBlock(block, target) : [block]) {
      if (bufferLength > 0 && bufferLength + piece.length > target) {
        const flushed = flush()
        if (flushed) seedOverlap(flushed)
      }
      append(piece)
    }
  }

  flush()
  return chunks
}

// ── Step 3: Embed ──────────────────────────────────────────────────────────

const embeddingModel = google.embedding(EMBEDDING_MODEL)

export type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"

function embeddingOptions(taskType: EmbeddingTask) {
  return {
    google: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType },
  }
}

function prepareForEmbedding(text: string): string {
  return text.length > MAX_EMBED_INPUT_CHARS ? text.slice(0, MAX_EMBED_INPUT_CHARS) : text
}

function assertDimensions(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding width mismatch: the model returned ${embedding.length} values but ` +
        `KnowledgeChunk.embedding is vector(${EMBEDDING_DIMENSIONS}). Change both together ` +
        `and re-index the workspace.`
    )
  }
}

/** Embeds a single value. Defaults to query-side because that is the hot path. */
export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTask = "RETRIEVAL_QUERY"
): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: prepareForEmbedding(text),
    maxRetries: 3,
    providerOptions: embeddingOptions(taskType),
  })

  assertDimensions(embedding)
  return embedding
}

/**
 * Embeds many values, batched and in order. Batches run sequentially: a large
 * document should not be able to spend a workspace's entire rate limit in one
 * burst and fail the whole ingest.
 */
export async function generateEmbeddings(
  texts: string[],
  taskType: EmbeddingTask = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  if (texts.length === 0) return []

  const all: number[][] = []

  for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBED_BATCH_SIZE).map((t) => prepareForEmbedding(t))

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
      maxRetries: 3,
      providerOptions: embeddingOptions(taskType),
    })

    if (embeddings.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: sent ${batch.length} values, received ${embeddings.length}.`
      )
    }

    embeddings.forEach(assertDimensions)
    all.push(...embeddings)
  }

  return all
}

// ── Step 4: Store chunks + embeddings as knowledge ─────────────────────────

export interface IngestResult {
  chunks: number
  skipped: boolean
  reason?: string
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}

/** What actually gets embedded — see invariant 3. */
function buildEmbeddingInput(
  title: string | null,
  heading: string | null,
  content: string
): string {
  const header = [title?.trim(), heading?.trim()].filter(Boolean).join(" › ")
  return header ? `${header}\n\n${content}` : content
}

export async function deleteKnowledgeChunks(
  sourceId: string,
  sourceType: KnowledgeSource
): Promise<number> {
  const { count } = await prisma.knowledgeChunk.deleteMany({ where: { sourceId, sourceType } })
  return count
}

/**
 * Replaces everything indexed for one source. Still a full re-index rather than
 * a diff — simple, and correct even when a document is edited beyond
 * recognition — but the expensive half now happens before the write: embeddings
 * are produced first, and only then does a single transaction swap old chunks
 * for new. A failed embed leaves the previous index intact instead of wiping a
 * document out of the agent's reach.
 */
export async function ingestDocumentKnowledge(
  workspaceId: string,
  sourceId: string,
  sourceType: KnowledgeSource,
  title: string | null,
  content: string,
  metadata?: Record<string, unknown>
): Promise<IngestResult> {
  const trimmed = content?.trim() ?? ""

  if (!trimmed) {
    // Nothing to index, but stale chunks must not outlive their source.
    await deleteKnowledgeChunks(sourceId, sourceType)
    return { chunks: 0, skipped: true, reason: "empty content" }
  }

  const truncated = trimmed.length > MAX_DOCUMENT_CHARS
  if (truncated) {
    warn(
      `⚠️ "${title ?? sourceId}" is ${trimmed.length} chars; indexing the first ${MAX_DOCUMENT_CHARS}.`
    )
  }

  const chunks = chunkText(truncated ? trimmed.slice(0, MAX_DOCUMENT_CHARS) : trimmed)
  if (chunks.length === 0) {
    await deleteKnowledgeChunks(sourceId, sourceType)
    return { chunks: 0, skipped: true, reason: "no usable text after normalization" }
  }

  const embeddings = await generateEmbeddings(
    chunks.map((chunk) => buildEmbeddingInput(title, chunk.heading, chunk.content)),
    "RETRIEVAL_DOCUMENT"
  )

  await prisma.$transaction(
    async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { sourceId, sourceType } })

      for (let start = 0; start < chunks.length; start += INSERT_BATCH_SIZE) {
        const batch = chunks.slice(start, start + INSERT_BATCH_SIZE)
        const values: unknown[] = []
        const rows: string[] = []

        for (const chunk of batch) {
          const base = values.length
          rows.push(
            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, ` +
              `$${base + 6}, $${base + 7}::vector, $${base + 8}, $${base + 9}::jsonb, NOW())`
          )
          values.push(
            randomUUID(),
            workspaceId,
            sourceType,
            sourceId,
            title,
            chunk.content,
            toVectorLiteral(embeddings[chunk.chunkIndex]),
            chunk.chunkIndex,
            JSON.stringify({
              ...(metadata ?? {}),
              heading: chunk.heading,
              charCount: chunk.charCount,
              chunkCount: chunks.length,
              ...(truncated ? { truncated: true } : {}),
            })
          )
        }

        await tx.$executeRawUnsafe(
          `INSERT INTO "KnowledgeChunk" ("id", "workspaceId", "sourceType", "sourceId", "title", "content", "embedding", "chunkIndex", "metadata", "createdAt")
           VALUES ${rows.join(", ")}`,
          ...values
        )
      }
    },
    { timeout: 60_000, maxWait: 15_000 }
  )

  return { chunks: chunks.length, skipped: false }
}

// ── Step 5: Retrieve relevant chunks at query time ─────────────────────────

export interface RetrievedChunk {
  id: string
  content: string
  title: string | null
  sourceType: string
  sourceId: string
  chunkIndex: number
  metadata: Record<string, unknown> | null
  /** Cosine similarity against the query, 0–1. */
  similarity: number
  /** Ranking score actually used to order results (fused, when hybrid). */
  score: number
}

export interface SearchOptions {
  /** Drop anything below this cosine similarity. Irrelevant context hurts. */
  minSimilarity?: number
  /** Also drop anything below `topSimilarity * ratio`. Set 0 to disable. */
  relativeRatio?: number
  /** Restrict to certain kinds of source, e.g. only DOCUMENT. */
  sourceTypes?: KnowledgeSource[]
  /** Restrict to specific sources, e.g. the documents of one project. */
  sourceIds?: string[]
  /** Soft cap of chunks per source, so one long file cannot fill every slot. */
  maxPerSource?: number
  /** Set false to skip the lexical arm and rank on vectors alone. */
  hybrid?: boolean
}

interface RawHit {
  id: string
  content: string
  title: string | null
  sourceType: string
  sourceId: string
  chunkIndex: number
  metadata: Record<string, unknown> | null
  similarity: number
  score: number
}

/** Collects bound parameters and hands back the placeholder for each. */
function createParams() {
  const values: unknown[] = []
  return {
    values,
    bind: (value: unknown) => `$${values.push(value)}`,
  }
}

function buildFilter(
  bind: (value: unknown) => string,
  workspaceId: string,
  options: SearchOptions
): string {
  const clauses = [`c."workspaceId" = ${bind(workspaceId)}`]

  if (options.sourceTypes?.length) {
    const list = options.sourceTypes.map((type) => bind(type)).join(", ")
    // Compared as text so this does not depend on the Postgres enum's name.
    clauses.push(`c."sourceType"::text IN (${list})`)
  }

  if (options.sourceIds?.length) {
    const list = options.sourceIds.map((id) => bind(id)).join(", ")
    clauses.push(`c."sourceId" IN (${list})`)
  }

  return clauses.join(" AND ")
}

const SELECTED_COLUMNS = `c.id, c.title, c.content, c."sourceType"::text AS "sourceType",
            c."sourceId", c."chunkIndex", c.metadata`

/** Vector search alone, ordered by cosine distance. */
async function vectorSearch(
  workspaceId: string,
  vector: string,
  candidates: number,
  options: SearchOptions
): Promise<RawHit[]> {
  const { values, bind } = createParams()
  const vec = bind(vector)
  const filter = buildFilter(bind, workspaceId, options)
  const take = bind(candidates)

  return prisma.$queryRawUnsafe<RawHit[]>(
    `SELECT ${SELECTED_COLUMNS},
            (1 - (c.embedding <=> ${vec}::vector))::float8 AS similarity,
            (1 - (c.embedding <=> ${vec}::vector))::float8 AS score
     FROM "KnowledgeChunk" c
     WHERE ${filter}
     ORDER BY c.embedding <=> ${vec}::vector
     LIMIT ${take}::int`,
    ...values
  )
}

/**
 * Vector search fused with Postgres full-text search by Reciprocal Rank Fusion.
 *
 * Embeddings are good at paraphrase and bad at exact tokens: ask for an error
 * code, a ticket number, a person's surname or an API name and a pure vector
 * index will happily return five passages that are merely about the same topic.
 * The lexical arm catches precisely those, RRF merges the two rankings without
 * needing their scores to be on a comparable scale, and the agent ends up with
 * context that contains the literal thing it was asked about.
 */
async function hybridSearch(
  workspaceId: string,
  vector: string,
  query: string,
  candidates: number,
  options: SearchOptions
): Promise<RawHit[]> {
  const { values, bind } = createParams()
  const vec = bind(vector)
  const filter = buildFilter(bind, workspaceId, options)
  const text = bind(query)
  const take = bind(candidates)

  return prisma.$queryRawUnsafe<RawHit[]>(
    `WITH vector_hits AS (
       SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${vec}::vector) AS rank
       FROM "KnowledgeChunk" c
       WHERE ${filter}
       ORDER BY c.embedding <=> ${vec}::vector
       LIMIT ${take}::int
     ),
     text_hits AS (
       SELECT c.id,
              ROW_NUMBER() OVER (
                ORDER BY ts_rank_cd(to_tsvector('${TEXT_SEARCH_CONFIG}', c.content), q.query) DESC
              ) AS rank
       FROM "KnowledgeChunk" c,
            websearch_to_tsquery('${TEXT_SEARCH_CONFIG}', ${text}) AS q(query)
       WHERE ${filter}
         AND to_tsvector('${TEXT_SEARCH_CONFIG}', c.content) @@ q.query
       ORDER BY ts_rank_cd(to_tsvector('${TEXT_SEARCH_CONFIG}', c.content), q.query) DESC
       LIMIT ${take}::int
     ),
     fused AS (
       SELECT COALESCE(v.id, t.id) AS id,
              (COALESCE(${VECTOR_WEIGHT}::float8 / (${RRF_K} + v.rank), 0)
               + COALESCE(${TEXT_WEIGHT}::float8 / (${RRF_K} + t.rank), 0))::float8 AS score
       FROM vector_hits v
       FULL OUTER JOIN text_hits t ON t.id = v.id
     )
     SELECT ${SELECTED_COLUMNS},
            (1 - (c.embedding <=> ${vec}::vector))::float8 AS similarity,
            f.score AS score
     FROM fused f
     JOIN "KnowledgeChunk" c ON c.id = f.id
     ORDER BY f.score DESC
     LIMIT ${take}::int`,
    ...values
  )
}

/**
 * Identifies passages that are textually the same, whatever row they live in.
 * Deliberately the whole passage rather than a prefix: documents with a
 * repeated page header would collapse into one under prefix matching, and
 * silently losing a real passage is worse than keeping a near-duplicate.
 */
function contentKey(content: string): string {
  return content.replace(/\s+/g, " ").trim().toLowerCase()
}

/**
 * Prefers breadth across sources, then fills any remaining slots by score.
 * Five chunks from five pages of the same handbook look like thorough
 * retrieval and read to the agent as a single narrow source; spreading the
 * first picks across documents is what lets it cross-reference.
 *
 * Duplicate passages are dropped outright. The same file uploaded twice lands
 * under two sourceIds, which the per-source cap cannot see, and handing the
 * agent the same paragraph twice both wastes slots and reads as corroboration
 * from two independent sources.
 */
function diversify(hits: RawHit[], limit: number, maxPerSource: number): RawHit[] {
  const selected: RawHit[] = []
  const perSource = new Map<string, number>()
  const seen = new Set<string>()

  const take = (hit: RawHit): boolean => {
    const key = contentKey(hit.content)
    if (seen.has(key)) return false
    seen.add(key)
    selected.push(hit)
    return true
  }

  for (const hit of hits) {
    if (selected.length >= limit) break
    const used = perSource.get(hit.sourceId) ?? 0
    if (used >= maxPerSource) continue
    if (take(hit)) perSource.set(hit.sourceId, used + 1)
  }

  // Never return fewer results than exist just to honour the per-source cap.
  if (selected.length < limit) {
    const taken = new Set(selected.map((hit) => hit.id))
    for (const hit of hits) {
      if (selected.length >= limit) break
      if (!taken.has(hit.id)) take(hit)
    }
  }

  return selected
}

/**
 * Retrieves the passages most likely to answer `query` for this workspace.
 *
 * Over-fetches candidates, fuses vector and lexical rankings, drops anything
 * below the similarity floor, then spreads the results across sources. Returns
 * an empty array rather than padding with weak matches — the caller's prompt
 * already tells the agent to reach for its tools when nothing was retrieved,
 * and that is a far better outcome than confidently citing an unrelated page.
 */
export async function searchKnowledge(
  workspaceId: string,
  query: string,
  limit: number = DEFAULT_LIMIT,
  options: SearchOptions = {}
): Promise<RetrievedChunk[]> {
  const trimmed = query?.trim() ?? ""
  if (!workspaceId || !trimmed) return []

  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY
  const relativeRatio = options.relativeRatio ?? DEFAULT_RELATIVE_RATIO
  const maxPerSource = options.maxPerSource ?? Math.max(2, Math.ceil(limit / 2))
  const candidates = Math.max(limit * CANDIDATE_MULTIPLIER, limit)

  const startedAt = Date.now()
  const vector = toVectorLiteral(await generateEmbedding(trimmed, "RETRIEVAL_QUERY"))

  let hits: RawHit[]
  if (options.hybrid === false) {
    hits = await vectorSearch(workspaceId, vector, candidates, options)
  } else {
    try {
      hits = await hybridSearch(workspaceId, vector, trimmed, candidates, options)
    } catch (error) {
      // Full-text search is the optional half. If the text configuration is
      // missing or the query trips websearch_to_tsquery, degrade to vectors
      // rather than returning nothing.
      warn("⚠️ hybrid search failed; falling back to vector-only", error)
      hits = await vectorSearch(workspaceId, vector, candidates, options)
    }
  }

  // Hybrid ranking orders by fused score, so the strongest vector match is not
  // necessarily first — take the actual maximum as the reference point.
  const topSimilarity = hits.reduce((max, hit) => Math.max(max, hit.similarity), 0)
  const floor = Math.max(minSimilarity, topSimilarity * relativeRatio)

  const relevant = hits.filter((hit) => hit.similarity >= floor)
  const results = diversify(relevant, limit, maxPerSource).map((hit) => ({
    ...hit,
    metadata: (hit.metadata as Record<string, unknown> | null) ?? null,
  }))

  log(
    `🔎 "${trimmed.slice(0, 60)}" → ${hits.length} candidates, top=${topSimilarity.toFixed(3)}, ` +
      `${relevant.length} above ${floor.toFixed(3)}, returned ${results.length} in ${Date.now() - startedAt}ms`
  )

  return results
}

// ── Orchestrator: runs steps 1 → 4 as a background job after upload ────────

async function markFailed(documentId: string, message: string): Promise<void> {
  await prisma.document
    .update({
      where: { id: documentId },
      data: {
        processingStatus: "FAILED",
        processingError: message.slice(0, 1_000),
        processedAt: new Date(),
      },
    })
    .catch(() => {
      // Best-effort — if even the failure write fails, there is nothing further
      // to do from inside a fire-and-forget job.
    })
}

/**
 * Fire-and-forget processing for a freshly uploaded document.
 *
 * Status only advances to COMPLETED once the chunks are actually queryable. The
 * previous ordering marked a document complete before indexing, so an embedding
 * failure left a document that looked ready, answered nothing, and gave no
 * indication why.
 */
export async function processDocumentBackground(
  documentId: string,
  mediaType: string,
  filename: string,
  buffer: Buffer
): Promise<void> {
  const startedAt = Date.now()

  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: "PROCESSING", processingError: null },
    })

    const extractedText = normalizeText(await extractTextFromFile(buffer, mediaType, filename))

    if (!extractedText) {
      await markFailed(
        documentId,
        "No readable text found in this file. Scanned or image-only documents need OCR, which is not supported yet."
      )
      warn(`⚠️ no extractable text in "${filename}" (${documentId})`)
      return
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: { extractedText },
      select: { id: true, workspaceId: true, title: true, projectId: true },
    })

    const result = await ingestDocumentKnowledge(
      document.workspaceId,
      document.id,
      "DOCUMENT",
      document.title,
      extractedText,
      { filename, mediaType, ...(document.projectId ? { projectId: document.projectId } : {}) }
    )

    if (result.skipped) {
      await markFailed(documentId, `Nothing could be indexed: ${result.reason}.`)
      warn(`⚠️ "${filename}" produced no chunks: ${result.reason}`)
      return
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: "COMPLETED",
        processedAt: new Date(),
        processingError: null,
      },
    })

    log(
      `✅ indexed "${filename}" as ${result.chunks} chunks ` +
        `(${extractedText.length} chars) in ${Date.now() - startedAt}ms`
    )
  } catch (error) {
    warn(`❌ processing failed for "${filename}" (${documentId})`, error)
    await markFailed(documentId, error instanceof Error ? error.message : String(error))
  }
}
