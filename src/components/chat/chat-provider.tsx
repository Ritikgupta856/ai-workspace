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

type Attachment = {
  id: string
  type: "file"
  filename?: string
  mediaType: string
  url: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  attachments?: Attachment[]
  isStreaming?: boolean
}

type ChatPhase =
  | { type: "idle" }
  | { type: "thinking" }
  | { type: "streaming" }
  | { type: "error"; message: string }

type ToolActivity = {
  id: string
  tool: string
  label: string
  status: "running" | "completed" | "error"
  result?: string
}

export type ChatSummary = {
  id: string
  title: string | null
  updatedAt: string
}

interface ChatContextValue {
  messages: ChatMessage[]
  phase: ChatPhase
  toolActivities: ToolActivity[]
  streamedContent: string
  sendMessage: (text: string, attachments?: Attachment[]) => void
  stopGeneration: () => void
  retryLast: () => void
  clearMessages: () => void
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

async function readTextStream(
  response: Response,
  onText: (text: string) => void,
  signal: AbortSignal
) {
  if (!response.body) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (signal.aborted) break

    const text = decoder.decode(value, { stream: true })
    if (text) onText(text)
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<ChatPhase>({ type: "idle" })
  const [toolActivities, setToolActivities] = useState<ToolActivity[]>([])
  const [streamedContent, setStreamedContent] = useState("")
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  // `chatId` is read inside sendMessage but must not re-create it on every new
  // conversation, which would tear down the composer's callbacks mid-typing.
  // Written alongside every setChatId call, never during render.
  const chatIdRef = useRef<string | null>(null)

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

  const sendMessage = useCallback(
    async (text: string, attachments?: Attachment[]) => {
      if (!text.trim() && !attachments?.length) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        createdAt: new Date(),
        attachments,
      }

      setMessages((prev) => [...prev, userMessage])
      setPhase({ type: "thinking" })
      setStreamedContent("")
      setToolActivities([])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const history = [...messages, userMessage]

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "google",
            model: "gemini-2.5-flash",
            messages: history,
            chatId: chatIdRef.current,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        // The server creates the chat on the first turn and reports its id here.
        const serverChatId = response.headers.get("X-Chat-Id")
        if (serverChatId && serverChatId !== chatIdRef.current) {
          chatIdRef.current = serverChatId
          setChatId(serverChatId)
        }

        const contentType = response.headers.get("Content-Type") ?? ""
        const isJson = contentType.includes("application/json")

        if (isJson) {
          const data = await response.json()
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.message,
              createdAt: new Date(),
            },
          ])
          setPhase({ type: "idle" })
        } else {
          setPhase({ type: "streaming" })

          const assistantId = crypto.randomUUID()

          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              createdAt: new Date(),
              isStreaming: true,
            },
          ])

          let accumulated = ""

          await readTextStream(
            response,
            (text) => {
              accumulated += text
              setStreamedContent(accumulated)
            },
            controller.signal
          )

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulated, isStreaming: false }
                : m
            )
          )

          setStreamedContent("")
          setPhase({ type: "idle" })
        }

        refreshChats()
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setPhase({ type: "error", message: (err as Error).message })
      } finally {
        abortRef.current = null
      }
    },
    [messages, refreshChats]
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    )
    setPhase({ type: "idle" })
  }, [])

  const retryLast = useCallback(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant")
    if (!lastAssistant) return

    const withoutLast = messages.filter((m) => m.id !== lastAssistant.id)
    setMessages(withoutLast)
  }, [messages])

  const clearMessages = useCallback(() => {
    setMessages([])
    setPhase({ type: "idle" })
    setToolActivities([])
    setStreamedContent("")
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    chatIdRef.current = null
    setChatId(null)
    clearMessages()
  }, [clearMessages])

  const openChat = useCallback(
    async (id: string) => {
      abortRef.current?.abort()
      chatIdRef.current = id
      setChatId(id)
      setPhase({ type: "idle" })
      setToolActivities([])
      setStreamedContent("")

      try {
        const res = await fetch(`/api/chats/${id}`)
        if (!res.ok) throw new Error("Could not open that conversation")
        const data = (await res.json()) as {
          messages: {
            id: string
            role: string
            content: string
            attachments: Attachment[] | null
            createdAt: string
          }[]
        }

        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
            createdAt: new Date(m.createdAt),
            attachments: m.attachments ?? undefined,
          }))
        )
      } catch (err) {
        setMessages([])
        setPhase({ type: "error", message: (err as Error).message })
      }
    },
    []
  )

  const deleteChat = useCallback(
    async (id: string) => {
      setChats((prev) => prev.filter((c) => c.id !== id))
      if (chatIdRef.current === id) newChat()
      try {
        await fetch(`/api/chats/${id}`, { method: "DELETE" })
      } finally {
        refreshChats()
      }
    },
    [newChat, refreshChats]
  )

  const activeTitle = useMemo(() => {
    if (!chatId) return null
    return chats.find((c) => c.id === chatId)?.title ?? null
  }, [chatId, chats])

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      phase,
      toolActivities,
      streamedContent,
      sendMessage,
      stopGeneration,
      retryLast,
      clearMessages,
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
      phase,
      toolActivities,
      streamedContent,
      sendMessage,
      stopGeneration,
      retryLast,
      clearMessages,
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
