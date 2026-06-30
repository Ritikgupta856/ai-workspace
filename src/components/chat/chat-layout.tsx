"use client"

import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatMessages } from "./chat-messages"
import { Composer } from "./composer"
import { EmptyState } from "./empty-state"

function ChatInner() {
  const { messages } = useChatContext()
  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {isEmpty ? (
        <EmptyState />
      ) : (
        <ChatMessages />
      )}
      <Composer />
    </div>
  )
}

export function ChatLayout() {
  return (
    <ChatProvider>
      <ChatInner />
    </ChatProvider>
  )
}
