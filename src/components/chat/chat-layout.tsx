"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ChatProvider, useChatContext } from "./chat-provider"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { Composer } from "./composer"
import { EmptyState } from "./empty-state"

export interface ChatLayoutProps {
  /** "Good morning" etc. — resolved on the server so it matches the home page. */
  greeting: string
  firstName: string
}

/**
 * Deep links from ⌘K search: `?chat=<id>` reopens a conversation and `?q=<text>`
 * starts a fresh one with that question. Params are stripped once handled so a
 * reload doesn't resend the question.
 */
function AgentQuerySync() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { messages, newChat, openChat, sendMessage } = useChatContext()
  const pendingQuestionRef = useRef<string | null>(null)
  // Strict mode re-runs effects on mount; without this the question is sent twice.
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    const chat = searchParams.get("chat")
    const question = searchParams.get("q")?.trim()
    if (!chat && !question) {
      handledRef.current = null
      return
    }

    const key = searchParams.toString()
    if (handledRef.current === key) return
    handledRef.current = key

    if (chat) {
      openChat(chat)
    } else if (question) {
      // sendMessage closes over the current messages, so the question waits for
      // the cleared conversation to render (see the effect below).
      pendingQuestionRef.current = question
      newChat()
    }

    router.replace(window.location.pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const question = pendingQuestionRef.current
    if (question === null || messages.length > 0) return
    pendingQuestionRef.current = null
    sendMessage(question)
  }, [messages.length, sendMessage])

  return null
}

function ChatInner({ greeting, firstName }: ChatLayoutProps) {
  const { messages } = useChatContext()
  const isEmpty = messages.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader />
      {/* Empty conversations carry their own centred composer, so the docked
          one would be a second input on the same screen. */}
      {isEmpty ? (
        <EmptyState greeting={greeting} firstName={firstName} />
      ) : (
        <>
          <ChatMessages />
          <Composer />
        </>
      )}
    </div>
  )
}

export function ChatLayout(props: ChatLayoutProps) {
  return (
    <ChatProvider>
      <ChatInner {...props} />
      <Suspense fallback={null}>
        <AgentQuerySync />
      </Suspense>
    </ChatProvider>
  )
}
