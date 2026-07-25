import type { ModelMessage, UserModelMessage } from "ai"

import { prisma } from "@/lib/prisma"
import { searchKnowledge } from "@/lib/knowledge/ingest"
import { buildSystemPrompt } from "@/lib/ai/prompts"

type CoreMessage = ModelMessage
type CoreUserMessage = UserModelMessage

type Attachment = {
  id: string
  type: "file"
  filename?: string
  mediaType: string
  url: string
}

type IncomingMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  attachments?: Attachment[]
}

export type BuildChatContextResult =
  | {
      type: "success"
      systemPrompt: string | undefined
      messages: CoreMessage[]
    }
  | {
      type: "skip"
      message: string
    }

export interface BuildChatContextParams {
  workspaceSystemPrompt: string | undefined
  messages: IncomingMessage[]
  workspaceId?: string
  viewer?: { name?: string; workspace?: string }
}

const DOCUMENT_BEHAVIOR_INSTRUCTIONS = `## Attached documents

The user attached one or more documents to this turn. They are the primary context for the request.

Any vague reference — "this", "this file", "my resume", "review it", "summarize it", "what are my skills" — means the attached document(s). Resolve it that way instead of asking which one.

Answer from the document directly. If something the user asked about is genuinely absent from it, say that it isn't in the document rather than guessing or filling the gap from elsewhere without saying so.

Keep using workspace sources alongside the document when they add something, and fold both into one answer rather than reporting them separately.`

function buildStructuredDocumentPrompt(docs: { title: string; extractedText: string | null }[], userContent: string): string {
  const docBlocks = docs.map((doc, idx) => {
    return [
      `Document ${idx + 1}`,
      ``,
      `Title:`,
      `${doc.title}`,
      ``,
      `Content:`,
      `${doc.extractedText ?? ""}`,
    ].join("\n")
  })

  const wrapped = [
    `<attached_documents>`,
    ``,
    docBlocks.join("\n\n--------------------------------\n\n"),
    ``,
    `</attached_documents>`,
  ].join("\n")

  if (userContent.trim()) {
    return `${wrapped}\n\nUser Request:\n\n${userContent}`
  }

  return wrapped
}

function buildLegacyDocumentPrompt(docs: { title: string; extractedText: string | null }[], userContent: string): string {
  let docText = ""
  if (docs.length === 1) {
    const doc = docs[0]
    docText = `The user attached the following document.\n\nTitle:\n${doc.title}\n\nContent:\n${doc.extractedText ?? ""}\n\nUse this document to answer the user's question.`
  } else {
    docText = `The user attached the following documents.\n\n`
    const docBlocks = docs.map((doc, idx) => {
      return `Document ${idx + 1}\n\nTitle\n${doc.title}\n\nContent\n${doc.extractedText ?? ""}`
    })
    docText += docBlocks.join("\n\n-------------------\n\n")
    docText += `\n\nUse these documents to answer the user's question.`
  }

  if (userContent.trim()) {
    return `${docText}\n\n${userContent}`
  }

  return docText
}

export async function buildChatContext(
  params: BuildChatContextParams
): Promise<BuildChatContextResult> {
  const { workspaceSystemPrompt, messages, workspaceId, viewer } = params

  let documentInstructions: string | undefined
  let knowledge: string | undefined
  const modelMessages: CoreMessage[] = []

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]

    if (m.role === "user" && m.attachments?.length) {
      const parts: CoreUserMessage["content"] = []

      const nonImageAttachments = m.attachments.filter(
        (att) => !att.mediaType || !att.mediaType.startsWith("image/")
      )
      const imageAttachments = m.attachments.filter(
        (att) => att.mediaType && att.mediaType.startsWith("image/")
      )

      if (nonImageAttachments.length > 0) {
        const fileIds = nonImageAttachments
          .map((att) => att.id)
          .filter((id): id is string => typeof id === "string" && id !== "")

        if (fileIds.length > 0) {
          const dbDocs = await prisma.document.findMany({
            where: { id: { in: fileIds } },
          })

          const incompleteDocs = dbDocs.filter(
            (d) => d.processingStatus !== "COMPLETED" && d.processingStatus !== "FAILED"
          )
          const hasFailedDocs = dbDocs.some((d) => d.processingStatus === "FAILED")

          if (incompleteDocs.length > 0 && !hasFailedDocs) {
            return {
              type: "skip",
              message: "Your document is still being processed. I'll be able to answer questions about it in a few seconds.",
            }
          }

          if (hasFailedDocs) {
            const failedDoc = dbDocs.find((d) => d.processingStatus === "FAILED")
            return {
              type: "skip",
              message: `Failed to process document "${failedDoc?.title ?? "file"}". Error: ${failedDoc?.processingError || "Unknown error"}.`,
            }
          }

          const emptyDocs = dbDocs.filter(
            (d) => d.processingStatus === "COMPLETED" && !d.extractedText?.trim()
          )
          if (emptyDocs.length > 0) {
            const names = emptyDocs.map((d) => d.title).join(", ")
            return {
              type: "skip",
              message: `I wasn't able to extract any text from "${names}". The file may be an image or an unsupported format.`,
            }
          }

          const isLastUserMessage =
            i === messages.length - 1 ||
            messages.slice(i + 1).every((next) => next.role !== "user")

          if (isLastUserMessage) {
            documentInstructions = DOCUMENT_BEHAVIOR_INSTRUCTIONS

            parts.push({
              type: "text",
              text: buildStructuredDocumentPrompt(dbDocs, m.content),
            })
          } else {
            parts.push({
              type: "text",
              text: buildLegacyDocumentPrompt(dbDocs, m.content),
            })
          }
        } else {
          if (m.content.trim()) {
            parts.push({ type: "text", text: m.content })
          }
        }
      } else {
        if (m.content.trim()) {
          parts.push({ type: "text", text: m.content })
        }
      }

      for (const att of imageAttachments) {
        parts.push({ type: "image", image: att.url })
      }

      if (parts.length > 0) {
        modelMessages.push({ role: "user", content: parts } satisfies CoreUserMessage)
      } else if (m.content.trim()) {
        modelMessages.push({ role: "user", content: m.content })
      }
    } else {
      modelMessages.push({ role: m.role, content: m.content })
    }
  }

  if (workspaceId) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMsg?.content.trim()) {
      console.log(`[RAG] 🔎 Auto-RAG: searching knowledge for query="${lastUserMsg.content.slice(0, 80)}"`)
      try {
        const chunks = await searchKnowledge(workspaceId, lastUserMsg.content, 5)
        if (chunks.length > 0) {
          const knowledgeContext = chunks
            .map((c, i) => {
              const label = c.title ?? "Untitled"
              return [
                `### Excerpt ${i + 1} — ${label}`,
                `Source type: ${c.sourceType.toLowerCase()}`,
                ``,
                c.content,
              ].join("\n")
            })
            .join("\n\n")

          knowledge = [
            `## Retrieved from the workspace knowledge base`,
            ``,
            `These excerpts were pulled for this question before you saw it. Treat them as`,
            `evidence you already gathered — use what is relevant and ignore what is not, without`,
            `mentioning the retrieval itself. Cite an excerpt by its title in bold.`,
            ``,
            `An excerpt that does not answer the question is not a dead end: search the connected`,
            `sources with your tools before concluding that something isn't recorded anywhere.`,
            ``,
            knowledgeContext,
          ].join("\n")

          console.log(`[RAG] ✅ Auto-RAG: injected ${chunks.length} chunks into system prompt`)
        } else {
          console.log(`[RAG] ℹ️ Auto-RAG: no relevant chunks found for query`)
        }
      } catch (err) {
        console.error(`[RAG] ⚠️ Auto-RAG search failed:`, err)
      }
    }
  }

  return {
    type: "success",
    systemPrompt: buildSystemPrompt({
      capabilities: workspaceSystemPrompt,
      knowledge,
      documentInstructions,
      viewer,
    }),
    messages: modelMessages,
  }
}
