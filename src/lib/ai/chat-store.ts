import type { FileUIPart } from "ai"

import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { messageText, type ChatSource, type ChatUIMessage } from "@/lib/ai/chat-message"

/** First line of the opening question, used as the chat's title until renamed. */
function deriveTitle(text: string) {
  const firstLine = text.trim().split("\n")[0].trim()
  if (!firstLine) return "New chat"
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine
}

function hasAnswer(message: ChatUIMessage) {
  return message.parts.some(
    (part) => part.type === "text" || part.type === "dynamic-tool" || part.type.startsWith("tool-")
  )
}

/**
 * Mirrors the client's conversation into the database. Only the latest turn is
 * written; messages the client no longer holds (a regenerated answer) are
 * removed, and an answer that produced nothing is not stored.
 */
export async function saveChat({
  chatId,
  userId,
  workspaceId,
  messages,
}: {
  chatId: string
  userId: string
  workspaceId: string
  messages: ChatUIMessage[]
}) {
  const kept = messages.filter(
    (message) => message.role === "user" || (message.role === "assistant" && hasAnswer(message))
  )
  const lastUserIndex = kept.findLastIndex((message) => message.role === "user")
  if (lastUserIndex === -1) return

  const turn = kept.slice(lastUserIndex)
  const foreign = await prisma.message.count({
    where: { id: { in: turn.map((message) => message.id) }, chatId: { not: chatId } },
  })
  if (foreign > 0) throw new Error(`Chat ${chatId} received message ids owned by another chat`)

  const now = Date.now()

  await prisma.$transaction([
    prisma.chat.upsert({
      where: { id: chatId },
      create: { id: chatId, workspaceId, createdById: userId, title: deriveTitle(messageText(kept[0])) },
      update: { updatedAt: new Date(now) },
    }),
    prisma.message.deleteMany({
      where: { chatId, id: { notIn: kept.map((message) => message.id) } },
    }),
    ...turn.map((message, index) => {
      const data = {
        content: messageText(message),
        parts: message.parts as Prisma.InputJsonValue,
        citations: (message.metadata?.sources as Prisma.InputJsonValue | undefined) ?? undefined,
      }
      return prisma.message.upsert({
        where: { id: message.id },
        create: {
          ...data,
          id: message.id,
          chatId,
          role: message.role,
          userId: message.role === "user" ? userId : null,
          createdAt: new Date(now + index),
        },
        update: data,
      })
    }),
  ])
}

type StoredMessage = {
  id: string
  role: string
  content: string
  parts: Prisma.JsonValue
  attachments: Prisma.JsonValue
  citations: Prisma.JsonValue
}

/** Messages saved before parts were stored carry only text and an attachments list. */
function legacyParts(message: StoredMessage): ChatUIMessage["parts"] {
  const attachments = Array.isArray(message.attachments)
    ? (message.attachments as { url?: string; mediaType?: string; filename?: string }[])
    : []
  const files: FileUIPart[] = attachments.flatMap((attachment) =>
    attachment.url && /^(https?:|data:)/.test(attachment.url)
      ? [{ type: "file", url: attachment.url, mediaType: attachment.mediaType ?? "", filename: attachment.filename }]
      : []
  )
  return [...files, { type: "text", text: message.content }]
}

export function toChatUIMessage(message: StoredMessage): ChatUIMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    parts: Array.isArray(message.parts) ? (message.parts as ChatUIMessage["parts"]) : legacyParts(message),
    metadata: Array.isArray(message.citations) ? { sources: message.citations as ChatSource[] } : undefined,
  }
}
