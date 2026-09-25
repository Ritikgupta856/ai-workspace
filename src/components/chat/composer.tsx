"use client"

import { useEffect, useRef, useState, useCallback, type KeyboardEvent, type ChangeEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Square,
  SendHorizontal,
  ChevronDown,
  Check,
} from "lucide-react"
import type { FileUIPart } from "ai"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { cn } from "@/lib/utils"
import { useChatContext } from "./chat-provider"
import { AGENT_MODELS } from "./models"

// Send and stop use the app's primary blue.
const ACCENT = "bg-primary text-primary-foreground hover:bg-primary/90"

const EXAMPLE_PROMPTS = [
  "Summarise what shipped this week and flag anything at risk…",
  "What's blocking the current sprint?",
  "Plan my day from my open tasks and deadlines…",
  "Turn my latest page into tasks…",
  "Review the code in my latest pull request…",
]

/** Stands in for the textarea placeholder on an empty conversation, cycling through examples. */
function RotatingPlaceholder() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length), 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 text-[15px] leading-6 text-muted-foreground/60">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          className="block truncate"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {EXAMPLE_PROMPTS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

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
}

function SendButton({
  isGenerating,
  canSend,
  onSend,
  onStop,
  rounded,
}: {
  isGenerating: boolean
  canSend: boolean
  onSend: () => void
  onStop: () => void
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

  return (
    <button
      onClick={onSend}
      disabled={!canSend}
      className={cn(
        "flex size-8 items-center justify-center transition-all",
        shape,
        canSend ? ACCENT : "bg-primary/30 text-primary-foreground dark:bg-primary/25"
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
  const { status, sendMessage, stop } = useChatContext()
  const isCentered = variant === "centered"
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<AttachmentState[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const isGenerating = status === "submitted" || status === "streaming"
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
            ? // Swap the local blob: preview for the hosted URL — the server
              // (and anyone reopening this chat later) can't read a blob: URL.
              { ...a, uploadStatus: "done" as const, url: data.url ?? a.url }
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
    const files: FileUIPart[] = attachments
      .filter((a) => a.uploadStatus === "done")
      .map((a) => ({ type: "file", filename: a.filename, mediaType: a.mediaType, url: a.url }))
    sendMessage(input, files.length > 0 ? files : undefined)
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
        !isCentered && "dark:bg-background/80 backdrop-blur-sm",
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
              className="mb-2"
            >
              <Attachments variant="inline">
                {attachments.map((att) => (
                  <Attachment
                    key={att.id}
                    data={{ id: att.id, type: "file", filename: att.filename, mediaType: att.mediaType, url: att.url }}
                    onRemove={() => removeAttachment(att.id)}
                    className={cn(
                      "text-[13px] font-normal",
                      att.uploadStatus === "error" && "border-destructive/40 bg-destructive/10 text-destructive"
                    )}
                    title={att.uploadStatus === "error" ? "Upload failed" : att.filename}
                  >
                    <AttachmentPreview loading={att.uploadStatus === "uploading"} />
                    <AttachmentInfo className="max-w-32" />
                    <AttachmentRemove label={`Remove ${att.filename}`} />
                  </Attachment>
                ))}
              </Attachments>
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

        {/* One box, one size, in both states — it slides from the centre of
            an empty conversation down to the dock via the shared layoutId
            below rather than swapping for a visually different composer. */}
        <motion.div
          layout
          layoutId="chat-composer-box"
          transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
          className={cn(
            "rounded-xl border bg-card px-4 pt-3.5 pb-3 transition-[border-color,box-shadow]",
            // Glow in the app's primary blue; the send button and name stay orange.
            "border-primary/25 shadow-[0_12px_40px_-18px_rgba(79,107,255,0.45)]",
            "focus-within:border-primary/45 focus-within:shadow-[0_14px_44px_-16px_rgba(79,107,255,0.55)]",
            "dark:border-primary/30 dark:focus-within:border-primary/50"
          )}
        >
          <div className="relative">
            {isCentered && !input && <RotatingPlaceholder />}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isCentered ? undefined : "Ask anything..."}
              rows={3}
              className="placeholder:text-muted-foreground/60 relative max-h-64 min-h-16 w-full resize-none bg-transparent text-[15px] leading-6 outline-none"
              disabled={isGenerating}
              aria-label="Message input"
            />
          </div>

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
                onSend={handleSubmit}
                onStop={stop}
                rounded="lg"
              />
            </div>
          </div>
        </motion.div>

        {!isCentered && (
          <p className="text-muted-foreground/50 mt-2 text-center text-[10px]">
            Synapse can make mistakes. Verify important information.
          </p>
        )}
      </div>
    </div>
  )
}
