"use client"

import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { Composer } from "./composer"
import { EmptyState } from "./empty-state"

function ChatInner() {
  const { messages } = useChatContext()
  const isEmpty = messages.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader />
      {/* Empty conversations carry their own centred composer, so the docked
          one would be a second input on the same screen. */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <ChatMessages />
          <Composer />
        </>
      )}
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
