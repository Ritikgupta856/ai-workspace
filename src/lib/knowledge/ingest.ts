import { prisma } from "@/lib/prisma"
import { generateEmbedding, generateEmbeddings } from "@/lib/embeddings"
import { chunkTextByCharacters } from "./chunker"
import type { KnowledgeSource } from "@/generated/prisma/client"

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}${random}`
}

export async function ingestDocumentKnowledge(
  workspaceId: string,
  sourceId: string,
  sourceType: KnowledgeSource,
  title: string | null,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!content.trim()) {
    console.log(`[RAG] ⏭️ ingestDocumentKnowledge: empty content, skipping sourceId=${sourceId}`)
    return
  }

  console.log(`[RAG] 🧪 Chunking text: sourceId=${sourceId} totalChars=${content.length}`)
  await deleteKnowledgeChunks(sourceId, sourceType)

  const chunks = chunkTextByCharacters(content)
  console.log(`[RAG] 📦 Created ${chunks.length} chunks from document ${sourceId}`)

  const texts = chunks.map((c) => c.content)
  console.log(`[RAG] 🤖 Generating ${texts.length} embeddings via google.text-embedding-004 (768 dims)...`)
  const embeddings = await generateEmbeddings(texts)
  console.log(`[RAG] ✅ Embeddings generated: count=${embeddings.length} dims=${embeddings[0]?.length}`)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = embeddings[i]

    await prisma.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" ("id", "workspaceId", "sourceType", "sourceId", "title", "content", "embedding", "chunkIndex", "metadata", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9::jsonb, NOW())`,
      generateId(),
      workspaceId,
      sourceType,
      sourceId,
      title,
      chunk.content,
      `[${embedding.join(",")}]`,
      chunk.chunkIndex,
      JSON.stringify(metadata ?? {}),
    )
  }
  console.log(`[RAG] 💾 Stored ${chunks.length} knowledge chunks for sourceId=${sourceId}`)
}

export async function deleteKnowledgeChunks(
  sourceId: string,
  sourceType: KnowledgeSource
): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({
    where: { sourceId, sourceType },
  })
}

export async function searchKnowledge(
  workspaceId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; content: string; title: string | null; sourceType: string; similarity: number }>> {
  console.log(`[RAG] 🔍 searchKnowledge: workspaceId=${workspaceId} query="${query.slice(0, 80)}" limit=${limit}`)

  const queryEmbedding = await generateEmbedding(query)

  const result: Array<{
    id: string
    content: string
    title: string | null
    sourceType: string
    similarity: number
  }> = await prisma.$queryRawUnsafe(
    `SELECT id, content, title, "sourceType", 1 - (embedding <=> $1::vector) AS similarity
     FROM "KnowledgeChunk"
     WHERE "workspaceId" = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    `[${queryEmbedding.join(",")}]`,
    workspaceId,
    limit,
  )

  console.log(`[RAG] 🎯 searchKnowledge results: count=${result.length}`)
  for (const r of result) {
    console.log(`[RAG]    - title="${r.title}" type=${r.sourceType} similarity=${r.similarity.toFixed(4)} content="${r.content.slice(0, 60)}..."`)
  }

  return result
}
