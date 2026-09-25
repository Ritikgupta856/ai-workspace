"use client"

import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Check, CircleAlert, Copy, RefreshCcw, RotateCw } from "lucide-react"
import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
} from "ai"

import { Button } from "@/components/ui/button"
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { MessageAction, MessageActions } from "@/components/ai-elements/message"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { messageText, type ChatUIMessage } from "@/lib/ai/chat-message"
import { cn } from "@/lib/utils"
import { useChatContext } from "./chat-provider"
import { MessageMarkdown } from "./message-markdown"
import { ThinkingIndicator } from "./thinking-indicator"

/** Hidden until the message is hovered or focused; always shown on touch screens, which can't hover. */
const REVEAL_ON_HOVER =
  "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"

const toolTitle = (name: string) => {
  const words = name.replace(/[_-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const hasVisibleParts = (message: ChatUIMessage | undefined) =>
  Boolean(
    message?.parts.some(
      (part) => part.type === "text" || part.type === "reasoning" || isToolOrDynamicToolUIPart(part)
    )
  )

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [text])

  return (
    <MessageAction
      tooltip={copied ? "Copied" : "Copy"}
      onClick={handleCopy}
      className="size-8 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </MessageAction>
  )
}

function UserMessage({ message }: { message: ChatUIMessage }) {
  const text = messageText(message)
  const files = message.parts.filter((part) => part.type === "file")

  return (
    <div className="group/message flex flex-col items-end">
      {files.length > 0 && (
        <Attachments variant="inline" className="mb-2 max-w-[85%] justify-end sm:max-w-[70%]">
          {files.map((file, index) => (
            <Attachment key={`${file.url}-${index}`} data={{ ...file, id: `${message.id}-${index}` }}>
              <AttachmentPreview />
              <AttachmentInfo className="max-w-40 text-[13px] font-normal" />
            </Attachment>
          ))}
        </Attachments>
      )}

      {text && (
        <div className="max-w-[85%] rounded-2xl bg-foreground/[0.06] px-4 py-2.5 text-[15px] leading-7 break-words whitespace-pre-wrap dark:bg-foreground/[0.1] sm:max-w-[70%]">
          {text}
        </div>
      )}

      {text && (
        <MessageActions className={cn("mt-1", REVEAL_ON_HOVER)}>
          <CopyAction text={text} />
        </MessageActions>
      )}
    </div>
  )
}

function ToolCall({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  const title = toolTitle(getToolOrDynamicToolName(part))

  return (
    <Tool className="mb-0">
      {part.type === "dynamic-tool" ? (
        <ToolHeader type={part.type} state={part.state} toolName={part.toolName} title={title} />
      ) : (
        <ToolHeader type={part.type} state={part.state} title={title} />
      )}
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput output={part.output} errorText={part.errorText} />
      </ToolContent>
    </Tool>
  )
}

function AssistantMessage({
  message,
  isStreaming,
  isLatest,
}: {
  message: ChatUIMessage
  isStreaming: boolean
  isLatest: boolean
}) {
  const { regenerate } = useChatContext()
  const text = messageText(message)
  // Only sources the answer actually cites, by the bold title the prompt asks for.
  const cited = (message.metadata?.sources ?? []).filter((source) => text.includes(source.title))

  return (
    <div className="group/message flex flex-col gap-3">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return <MessageMarkdown key={index} content={part.text} isStreaming={part.state === "streaming"} />
        }
        if (part.type === "reasoning" && part.text) {
          return (
            <Reasoning key={index} className="mb-0" isStreaming={part.state === "streaming"}>
              <ReasoningTrigger />
              <ReasoningContent>{part.text}</ReasoningContent>
            </Reasoning>
          )
        }
        if (isToolOrDynamicToolUIPart(part)) {
          return <ToolCall key={part.toolCallId} part={part} />
        }
        return null
      })}

      {!isStreaming && cited.length > 0 && (
        <Sources className="mb-0">
          <SourcesTrigger count={cited.length} />
          <SourcesContent>
            {cited.map((source) => (
              <Source key={source.id} href={source.url} title={source.title} />
            ))}
          </SourcesContent>
        </Sources>
      )}

      {!isStreaming && text && (
        // The latest answer keeps its actions visible; older ones reveal on hover.
        <MessageActions className={cn("-ml-2", !isLatest && REVEAL_ON_HOVER)}>
          <CopyAction text={text} />
          {isLatest && (
            <MessageAction
              tooltip="Regenerate"
              onClick={regenerate}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <RefreshCcw className="size-4" />
            </MessageAction>
          )}
        </MessageActions>
      )}
    </div>
  )
}

function ErrorNotice({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const message =
    error instanceof TypeError
      ? "Couldn't reach Synapse. Check your connection and try again."
      : error.message || "Something went wrong. Please try again."

  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">Couldn&apos;t get a response</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="h-7 shrink-0 gap-1.5 px-2.5 text-[13px]"
      >
        <RotateCw className="size-3.5" />
        Retry
      </Button>
    </div>
  )
}

export function ChatMessages() {
  const { messages, status, error, regenerate } = useChatContext()

  const last = messages.at(-1)
  const lastAssistantId = messages.findLast((m) => m.role === "assistant")?.id
  const isWaiting =
    status === "submitted" ||
    (status === "streaming" && (last?.role !== "assistant" || !hasVisibleParts(last)))

  return (
    <Conversation className="min-h-0">
      <ConversationContent className="mx-auto w-full max-w-3xl gap-0 px-4 pt-8 pb-12 sm:px-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            // A new turn opens with more air than the gap between a question and its answer.
            className={message.role === "user" ? (index === 0 ? "" : "pt-8") : "pt-4"}
          >
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage
                message={message}
                isStreaming={status === "streaming" && message.id === last?.id}
                isLatest={message.id === lastAssistantId}
              />
            )}
          </motion.div>
        ))}

        {isWaiting && (
          <div className="pt-4">
            <ThinkingIndicator />
          </div>
        )}

        {error && <ErrorNotice error={error} onRetry={regenerate} />}
      </ConversationContent>

      <ConversationScrollButton className="bottom-3 size-8" />
    </Conversation>
  )
}
