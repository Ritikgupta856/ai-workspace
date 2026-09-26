"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type ChatStatus, type FileUIPart } from "ai"
import { toast } from "sonner"

import type { ChatUIMessage } from "@/lib/ai/chat-message"

export type ChatSummary = {
  id: string
  title: string | null
  updatedAt: string
}

interface ChatContextValue {
  messages: ChatUIMessage[]
  status: ChatStatus
  error: Error | undefined
  sendMessage: (text: string, files?: FileUIPart[]) => void
  regenerate: () => void
  stop: () => void
  /** Persisted history for the header dropdown. */
  chats: ChatSummary[]
  chatId: string | null
  activeTitle: string | null
  loadingChats: boolean
  newChat: () => void
  openChat: (id: string) => void
  deleteChat: (id: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export const useChatContext = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  // The chat whose history is loading, so a slower earlier load can't overwrite a later one.
  const openingRef = useRef<string | null>(null)

  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats")
      if (!res.ok) return
      const data = (await res.json()) as { chats: ChatSummary[] }
      setChats(data.chats ?? [])
    } catch {
      // History is a convenience; a failed refresh must not break the chat.
    } finally {
      setLoadingChats(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch("/api/chats")
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { chats: ChatSummary[] }
        if (!cancelled) setChats(data.chats ?? [])
      } catch {
        // Ignored — see refreshChats.
      } finally {
        if (!cancelled) setLoadingChats(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const [transport] = useState(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        // The server creates the chat on the first turn and reports its id here.
        fetch: async (input, init) => {
          const response = await fetch(input, init)
          const serverChatId = response.headers.get("X-Chat-Id")
          if (serverChatId) setChatId(serverChatId)
          return response
        },
      })
  )

  const {
    messages,
    setMessages,
    sendMessage: send,
    regenerate: resend,
    stop: halt,
    status,
    error,
    clearError,
  } = useChat<ChatUIMessage>({
    id: "agent",
    transport,
    onFinish: () => void refreshChats(),
  })

  const requestOptions = useMemo(() => ({ body: { chatId } }), [chatId])

  const sendMessage = useCallback(
    (text: string, files?: FileUIPart[]) => {
      const trimmed = text.trim()
      if (trimmed) void send({ text: trimmed, files }, requestOptions)
      else if (files?.length) void send({ files }, requestOptions)
    },
    [send, requestOptions]
  )

  const regenerate = useCallback(() => void resend(requestOptions), [resend, requestOptions])
  const stop = useCallback(() => void halt(), [halt])

  const newChat = useCallback(() => {
    stop()
    clearError()
    openingRef.current = null
    setChatId(null)
    setMessages([])
  }, [stop, clearError, setMessages])

  const openChat = useCallback(
    async (id: string) => {
      stop()
      clearError()
      openingRef.current = id
      setChatId(id)

      try {
        const res = await fetch(`/api/chats/${id}`)
        if (!res.ok) throw new Error(`Failed to load chat ${id}`)
        const data = (await res.json()) as { messages: ChatUIMessage[] }
        if (openingRef.current === id) setMessages(data.messages)
      } catch {
        if (openingRef.current !== id) return
        setMessages([])
        toast.error("Couldn't open that conversation.")
      }
    },
    [stop, clearError, setMessages]
  )

  const deleteChat = useCallback(
    async (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id))
      if (chatId === id) newChat()
      try {
        await fetch(`/api/chats/${id}`, { method: "DELETE" })
      } finally {
        refreshChats()
      }
    },
    [chatId, newChat, refreshChats]
  )

  const activeTitle = useMemo(() => {
    if (!chatId) return null
    return chats.find((c) => c.id === chatId)?.title ?? null
  }, [chatId, chats])

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      status,
      error,
      sendMessage,
      regenerate,
      stop,
      chats,
      chatId,
      activeTitle,
      loadingChats,
      newChat,
      openChat,
      deleteChat,
    }),
    [
      messages,
      status,
      error,
      sendMessage,
      regenerate,
      stop,
      chats,
      chatId,
      activeTitle,
      loadingChats,
      newChat,
      openChat,
      deleteChat,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
