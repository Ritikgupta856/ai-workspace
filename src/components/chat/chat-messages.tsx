"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDown, Check, Copy, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatContext, type ChatMessage } from "./chat-provider"
import { MessageMarkdown } from "./message-markdown"
import { ThinkingIndicator } from "./thinking-indicator"
import { ToolActivityList } from "./tool-activity"

/** Hidden until the message is hovered or focused; always shown on touch screens, which can't hover. */
const REVEAL_ON_HOVER =
  "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"

function CopyAction({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [text])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  // Older history can hold a blob: preview URL that died with its tab — show those as a file chip.
  const isViewableImage = (a: { mediaType?: string; url?: string }) =>
    Boolean(a.mediaType?.startsWith("image/") && /^(https?:|data:)/.test(a.url ?? ""))
  const images = message.attachments?.filter(isViewableImage) ?? []
  const files = message.attachments?.filter((a) => !isViewableImage(a)) ?? []

  return (
    <div className="group/message flex flex-col items-end">
      {(images.length > 0 || files.length > 0) && (
        <div className="mb-2 flex max-w-[85%] flex-wrap justify-end gap-2 sm:max-w-[70%]">
          {images.slice(0, 4).map((att) => (
            <img
              key={att.id}
              src={att.url}
              alt={att.filename ?? "Image"}
              className="size-20 rounded-xl border object-cover"
            />
          ))}
          {files.map((att) => (
            <div
              key={att.id}
              className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-[13px]"
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-40 truncate">{att.filename ?? "File"}</span>
            </div>
          ))}
        </div>
      )}

      {message.content && (
        <div className="max-w-[85%] rounded-2xl bg-foreground/[0.06] px-4 py-2.5 text-[15px] leading-7 break-words whitespace-pre-wrap dark:bg-foreground/[0.1] sm:max-w-[70%]">
          {message.content}
        </div>
      )}

      {message.content && (
        <div className={cn("mt-1 flex items-center", REVEAL_ON_HOVER)}>
          <CopyAction text={message.content} label="Copy message" />
        </div>
      )}
    </div>
  )
}

function AssistantMessage({
  message,
  streamedContent,
  isLatest,
}: {
  message: ChatMessage
  streamedContent: string
  isLatest: boolean
}) {
  const content = message.isStreaming ? streamedContent : message.content

  if (!content) {
    return message.isStreaming ? <ThinkingIndicator /> : null
  }

  return (
    <div className="group/message">
      <MessageMarkdown content={content} isStreaming={message.isStreaming} />

      {!message.isStreaming && (
        // The latest answer keeps its actions visible; older ones reveal on hover.
        <div className={cn("mt-2 -ml-2 flex items-center", !isLatest && REVEAL_ON_HOVER)}>
          <CopyAction text={content} label="Copy response" />
        </div>
      )}
    </div>
  )
}

export function ChatMessages() {
  const { messages, phase, toolActivities, streamedContent } = useChatContext()

  const containerRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const [showJump, setShowJump] = useState(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  // A new message (the user's own, or the answer starting) always brings the
  // conversation to the bottom.
  useEffect(() => {
    nearBottomRef.current = true
    scrollToBottom("smooth")
  }, [messages.length, scrollToBottom])

  // While text streams in, follow it — unless the reader has scrolled up.
  // Instant, because smooth-scrolling on every chunk stutters.
  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom("auto")
  }, [streamedContent, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    nearBottomRef.current = near
    setShowJump(!near)
  }, [])

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id
  const waitingForAnswer = phase.type === "thinking" && !messages.some((m) => m.isStreaming)

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        role="log"
        aria-live="polite"
      >
        <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-12 sm:px-6">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              // A new turn opens with more air than the gap between a question and its answer.
              className={msg.role === "user" ? (i === 0 ? "" : "pt-8") : "pt-4"}
            >
              {msg.role === "user" ? (
                <UserMessage message={msg} />
              ) : (
                <AssistantMessage
                  message={msg}
                  streamedContent={streamedContent}
                  isLatest={msg.id === lastAssistantId}
                />
              )}
            </motion.div>
          ))}

          {waitingForAnswer && (
            <div className="pt-4">
              <ThinkingIndicator />
            </div>
          )}

          {phase.type === "error" && (
            <p className="pt-4 text-[14px] text-destructive" role="alert">
              {phase.message || "Something went wrong."} Try sending your message again.
            </p>
          )}

          <ToolActivityList activities={toolActivities} />
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-3 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="size-4" />
        </button>
      )}
    </div>
  )
}
