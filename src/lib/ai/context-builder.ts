import { prisma } from "@/lib/prisma"
import { searchKnowledge } from "@/lib/knowledge/ingest"

type CoreMessage = any
type CoreUserMessage = any

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
}

const DOCUMENT_BEHAVIOR_INSTRUCTIONS = `Document Context Instructions

The user has attached one or more documents to this conversation. These documents are the primary context for the current request.

When the user refers to:
- "this", "this document", "this file"
- "my resume", "my file"
- "review this", "summarize it", "improve it"
- "extract information"
- "what are my skills", "what's my education"
- or any similar reference

Assume they are referring to the attached document(s).

Do NOT ask unnecessary clarification questions if the answer already exists inside the attached document(s). Only ask follow-up questions when absolutely necessary.

If the answer is contained in the document(s), answer directly. If information is missing from the document(s), clearly state that it is not present rather than guessing.

If workspace tools are also useful, continue using them normally alongside the document context. If both the document and workspace tools are relevant, combine both sources into a single comprehensive answer.`

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
  const { workspaceSystemPrompt, messages, workspaceId } = params

  let finalSystemPrompt = workspaceSystemPrompt
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
            if (workspaceSystemPrompt) {
              finalSystemPrompt = `${workspaceSystemPrompt}\n\n${DOCUMENT_BEHAVIOR_INSTRUCTIONS}`
            } else {
              finalSystemPrompt = DOCUMENT_BEHAVIOR_INSTRUCTIONS
            }

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
        const chunks = await searchKnowledge(workspaceId, lastUserMsg.content, 3)
        if (chunks.length > 0) {
          const knowledgeContext = chunks
            .map(
              (c, i) =>
                `[Knowledge ${i + 1}] (${c.sourceType})${c.title ? ` ${c.title}:` : ""}\n${c.content}`
            )
            .join("\n\n")

          const ragPrompt =
            `\n\n---\nRelevant Knowledge Base Context:\n${knowledgeContext}\n---\n` +
            `Use the above knowledge base excerpts when relevant to answer the user's question. ` +
            `If the information is insufficient, use your general knowledge or available tools.`

          if (finalSystemPrompt) {
            finalSystemPrompt += ragPrompt
          } else {
            finalSystemPrompt = ragPrompt
          }
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
    systemPrompt: finalSystemPrompt,
    messages: modelMessages,
  }
}
