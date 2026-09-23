"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Standalone smoke-test page for the Gemini wiring at /api/chat. */
export default function ChatPage() {
  // Fixed id: the default is Math.random()-based, which breaks prerendering
  // under cacheComponents. /api/chat keys persistence off `chatId`, not this.
  const { messages, sendMessage, status } = useChat({ id: "chat-smoke-test" })
  const [input, setInput] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col gap-4 p-6">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="text-sm">
            <span className="font-medium">
              {message.role === "user" ? "You: " : "Gemini: "}
            </span>
            {message.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
        {status === "submitted" && (
          <p className="text-sm text-muted-foreground">Thinking…</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
        />
        <Button type="submit" disabled={status === "streaming"}>
          Send
        </Button>
      </form>
    </div>
  )
}
