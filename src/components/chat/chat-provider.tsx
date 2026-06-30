"use client"

import {
  createContext,
  useCallback,
  useContext,
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

interface ChatContextValue {
  messages: ChatMessage[]
  phase: ChatPhase
  toolActivities: ToolActivity[]
  streamedContent: string
  sendMessage: (text: string, attachments?: Attachment[]) => void
  stopGeneration: () => void
  retryLast: () => void
  clearMessages: () => void
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
  const abortRef = useRef<AbortController | null>(null)

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
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
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
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setPhase({ type: "error", message: (err as Error).message })
      } finally {
        abortRef.current = null
      }
    },
    [messages]
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
    }),
    [messages, phase, toolActivities, streamedContent, sendMessage, stopGeneration, retryLast, clearMessages]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
