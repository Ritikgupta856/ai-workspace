import type { UIMessage } from "ai"

export type ChatSource = { id: string; title: string; url?: string }

export type ChatMessageMetadata = { sources?: ChatSource[] }

export type ChatUIMessage = UIMessage<ChatMessageMetadata>

export function messageText(message: Pick<UIMessage, "parts">) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
}
