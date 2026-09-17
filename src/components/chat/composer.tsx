"use client"

import { useRef, useState, useCallback, type KeyboardEvent, type ChangeEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Paperclip,
  Plus,
  Square,
  RotateCcw,
  Loader2,
  SendHorizontal,
  ChevronDown,
  Check,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { cn } from "@/lib/utils"
import { useChatContext } from "./chat-provider"
import { AGENT_MODELS } from "./models"

// The agent page's accent — warm orange, distinct from the app's indigo primary.
const ACCENT = "bg-orange-400 text-white hover:bg-orange-500"

/** Pill that switches which model the next turn runs on. */
function ModelPicker() {
  const { model, setModel } = useChatContext()
  const current = AGENT_MODELS.find((m) => m.id === model) ?? AGENT_MODELS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-[13px] text-foreground/90 transition-colors hover:bg-accent"
          aria-label="Choose model"
        >
          <span className="flex -space-x-1">
            <span className="size-3 rounded-full bg-violet-400 ring-1 ring-card" />
            <span className="size-3 rounded-full bg-pink-400 ring-1 ring-card" />
            <span className="size-3 rounded-full bg-orange-400 ring-1 ring-card" />
          </span>
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Model</DropdownMenuLabel>
        {AGENT_MODELS.map((m) => (
          <DropdownMenuItem key={m.id} onSelect={() => setModel(m.id)} className="gap-2">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px]">{m.label}</span>
              <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
            </span>
            {m.id === model && <Check className="size-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type AttachmentState = {
  id: string
  filename: string
  mediaType: string
  url: string
  uploadStatus: "uploading" | "done" | "error"
  documentId?: string
}

function SendButton({
  isGenerating,
  canSend,
  showRetry,
  onSend,
  onStop,
  onRetry,
  rounded,
}: {
  isGenerating: boolean
  canSend: boolean
  showRetry: boolean
  onSend: () => void
  onStop: () => void
  onRetry: () => void
  rounded: "lg" | "full"
}) {
  const shape = rounded === "full" ? "rounded-full" : "rounded-lg"

  if (isGenerating) {
    return (
      <button
        onClick={onStop}
        className={cn("flex size-8 items-center justify-center transition-colors", ACCENT, shape)}
        aria-label="Stop generation"
        type="button"
      >
        <Square className="size-4" />
      </button>
    )
  }

  if (showRetry) {
    return (
      <button
        onClick={onRetry}
        className={cn("flex size-8 items-center justify-center transition-colors", ACCENT, shape)}
        aria-label="Retry"
        type="button"
      >
        <RotateCcw className="size-4" />
      </button>
    )
  }

  return (
    <button
      onClick={onSend}
      disabled={!canSend}
      className={cn(
        "flex size-8 items-center justify-center transition-all",
        shape,
        canSend ? ACCENT : "bg-orange-200/70 text-white dark:bg-orange-500/30"
      )}
      aria-label="Send message"
      type="button"
    >
      <SendHorizontal className="size-4" strokeWidth={2.25} />
    </button>
  )
}

/**
 * `centered` drops the docked chrome (top border, backdrop, disclaimer) so the
 * same composer can sit in the middle of an empty conversation.
 */
export function Composer({ variant = "docked" }: { variant?: "docked" | "centered" }) {
  const { phase, sendMessage, stopGeneration, retryLast, messages } = useChatContext()
  const isCentered = variant === "centered"
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<AttachmentState[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const isGenerating = phase.type === "thinking" || phase.type === "streaming"
  const hasMessages = messages.length > 0
  const hasError = phase.type === "error"
  const isUploading = attachments.some((a) => a.uploadStatus === "uploading")
  const canSend =
    Boolean(input.trim() || attachments.length > 0) &&
    !isGenerating &&
    !isUploading

  const uploadFile = useCallback(async (file: File, localId: string) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
      const data = await res.json()
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === localId
            ? { ...a, uploadStatus: "done" as const, documentId: data.id }
            : a
        )
      )
    } catch {
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === localId ? { ...a, uploadStatus: "error" as const } : a
        )
      )
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (!canSend) return
    const uploaded = attachments
      .filter((a) => a.uploadStatus === "done" && a.documentId)
      .map((a) => ({ id: a.documentId!, type: "file" as const, filename: a.filename, mediaType: a.mediaType, url: a.url }))
    sendMessage(input.trim(), uploaded.length > 0 ? uploaded : undefined)
    setInput("")
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [canSend, input, attachments, sendMessage])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems = Array.from(files).map((file) => {
        const id = crypto.randomUUID()
        return {
          id,
          filename: file.name,
          mediaType: file.type,
          url: URL.createObjectURL(file),
          uploadStatus: "uploading" as const,
        }
      })
      setAttachments((prev) => [...prev, ...newItems])
      Array.from(files).forEach((file, i) => uploadFile(file, newItems[i].id))
    },
    [uploadFile]
  )

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return
      addFiles(files)
    },
    [addFiles]
  )

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        addFiles(files)
      }
    },
    [addFiles]
  )

  return (
    <div
      className={cn(
        !isCentered && "border-t bg-background/80 backdrop-blur-sm",
        isDragging && "bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn("mx-auto max-w-3xl", isCentered ? "px-0" : "px-4 py-3")}>
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex flex-wrap gap-2"
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
                    att.uploadStatus === "error"
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-muted/30"
                  )}
                >
                  {att.uploadStatus === "uploading" ? (
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  ) : att.uploadStatus === "error" ? (
                    <span className="text-xs text-destructive">⚠</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">📄</span>
                  )}
                  <span className="max-w-28 truncate text-xs">{att.filename}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Remove ${att.filename}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          aria-label="Upload files"
        />

        {isCentered ? (
          /* Input on top, controls on their own row underneath — the tall
             composer from the reference, where the box invites a paragraph
             rather than a one-liner. */
          <div
            className={cn(
              "rounded-xl border bg-card px-4 pt-3.5 pb-3 transition-[border-color,box-shadow]",
              // Glow in the app's primary blue; the send button and name stay orange.
              "border-primary/25 shadow-[0_12px_40px_-18px_rgba(79,107,255,0.45)]",
              "focus-within:border-primary/45 focus-within:shadow-[0_14px_44px_-16px_rgba(79,107,255,0.55)]",
              "dark:border-primary/30 dark:focus-within:border-primary/50"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Example: Summarise what shipped this week and flag anything at risk…"
              rows={3}
              className="placeholder:text-muted-foreground/60 max-h-64 min-h-16 w-full resize-none bg-transparent text-[15px] leading-6 outline-none"
              disabled={isGenerating}
              aria-label="Message input"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors"
                  aria-label="Attach files"
                  type="button"
                >
                  <Plus className="size-4" />
                </button>
                <span className="mx-1.5 h-4 w-px bg-border" />
                <ModelPicker />
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <SpeechInput
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-lg bg-transparent text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
                  onTranscriptionChange={(text) =>
                    setInput((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text))
                  }
                  aria-label="Dictate"
                />
                <SendButton
                  isGenerating={isGenerating}
                  canSend={canSend}
                  showRetry={hasError || (hasMessages && !canSend)}
                  onSend={handleSubmit}
                  onStop={stopGeneration}
                  onRetry={retryLast}
                  rounded="lg"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="focus-within:border-primary/50 relative flex items-end gap-2 rounded-2xl border bg-background px-4 py-2 shadow-sm transition-shadow focus-within:shadow-md">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:bg-accent hover:text-foreground mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
              aria-label="Attach files"
              type="button"
            >
              <Paperclip className="size-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Ask anything..."
              rows={1}
              className="placeholder:text-muted-foreground/60 max-h-50 min-h-6 flex-1 resize-none bg-transparent py-1.5 text-sm leading-6 outline-none"
              disabled={isGenerating}
              aria-label="Message input"
            />

            <div className="mb-0.5 flex shrink-0 items-center gap-1">
              <ModelPicker />
              <SendButton
                isGenerating={isGenerating}
                canSend={canSend}
                showRetry={hasError || (hasMessages && !canSend)}
                onSend={handleSubmit}
                onStop={stopGeneration}
                onRetry={retryLast}
                rounded="lg"
              />
            </div>
          </div>
        )}

        {!isCentered && (
          <p className="text-muted-foreground/50 mt-2 text-center text-[10px]">
            Synapse can make mistakes. Verify important information.
          </p>
        )}
      </div>
    </div>
  )
}
