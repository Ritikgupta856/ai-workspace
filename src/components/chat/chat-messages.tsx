"use client"

import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDown, Copy, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatContext, type ChatMessage } from "./chat-provider"
import { MessageMarkdown } from "./message-markdown"
import { ThinkingIndicator, TypingCursor } from "./thinking-indicator"
import { ToolActivityList } from "./tool-activity"

function UserMessage({ message }: { message: ChatMessage }) {
  const time = useMemo(() => new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }), [message.createdAt])

  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [message.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-end"
    >
      <div className="group relative max-w-[80%] md:max-w-[70%]">
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 justify-end">
            {message.attachments
              .filter((a) => a.mediaType?.startsWith("image/"))
              .slice(0, 4)
              .map((att) => (
                <div
                  key={att.id}
                  className="size-16 overflow-hidden rounded-lg border"
                >
                  <img
                    src={att.url}
                    alt={att.filename ?? "Image"}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            {message.attachments
              .filter((a) => !a.mediaType?.startsWith("image/"))
              .map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground">📄</span>
                  <span className="truncate max-w-32">{att.filename ?? "File"}</span>
                </div>
              ))}
          </div>
        )}
        <div className="rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
          <p className="text-sm leading-7 whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>

        <div className="absolute -top-8 right-0 flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
          <button
            onClick={handleCopy}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Copy message"
          >
            {copied ? <span className="text-[9px] font-medium">OK</span> : <Copy className="size-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AssistantMessage({
  message,
  streamedContent,
}: {
  message: ChatMessage
  streamedContent: string
}) {
  const displayContent = message.isStreaming ? streamedContent : message.content
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content || streamedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [message.content, streamedContent])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-3 group"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="size-4 text-primary"
          aria-hidden="true"
        >
          <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="currentColor" opacity="0.2" />
          <path d="M16 6c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6z" fill="currentColor" opacity="0.4" />
          <path d="M16 10c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" fill="currentColor" />
        </svg>
      </div>
      <div className="min-w-0 flex-1 pt-0.5 relative">
        {displayContent ? (
          <div className="text-sm leading-7">
            <MessageMarkdown content={displayContent} />
            {message.isStreaming && <TypingCursor />}
          </div>
        ) : message.isStreaming ? (
          <div className="text-sm text-muted-foreground italic">
            Generating...
          </div>
        ) : null}

        {!message.isStreaming && displayContent && (
          <div className="flex items-center gap-0.5 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Copy response"
            >
              {copied ? <span className="text-[9px] font-medium">OK</span> : <Copy className="size-3" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ChatMessages() {
  const {
    messages,
    phase,
    toolActivities,
    streamedContent,
  } = useChatContext()

  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }, [])

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom(phase.type === "streaming")
    }
  }, [messages, streamedContent, phase, isNearBottom, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const threshold = 100
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsNearBottom(near)
  }, [])

  const showThinking =
    (phase.type === "thinking" || phase.type === "streaming") &&
    !messages.some((m) => m.isStreaming)

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto"
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <UserMessage message={msg} />
              ) : (
                <AssistantMessage
                  message={msg}
                  streamedContent={streamedContent}
                />
              )}
            </div>
          ))}
        </AnimatePresence>

        {showThinking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ThinkingIndicator phase={phase.type as "thinking" | "streaming"} />
          </motion.div>
        )}

        <ToolActivityList activities={toolActivities} />

        <div ref={bottomRef} />
      </div>

      {!isNearBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground"
          aria-label="Scroll to latest"
        >
          <ArrowDown className="size-3.5" />
          Latest
        </button>
      )}
    </div>
  )
}
