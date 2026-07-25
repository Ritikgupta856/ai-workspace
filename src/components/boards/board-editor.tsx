"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Check, Loader2, Trash2 } from "lucide-react"

import "@excalidraw/excalidraw/index.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Excalidraw reads `window` at module scope, so it can only be loaded in the
 * browser. Keeping it behind `dynamic` also keeps ~1MB of editor out of every
 * other route's bundle.
 */
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading canvas…
      </div>
    ),
  }
)

type SaveState = "idle" | "saving" | "saved" | "error"

export type BoardData = {
  id: string
  title: string
  scene: { elements?: unknown[]; appState?: Record<string, unknown> } | null
  files: Record<string, unknown> | null
}

const AUTOSAVE_DELAY = 1200

export function BoardEditor({ board }: { board: BoardData }) {
  const router = useRouter()
  const [title, setTitle] = React.useState(board.title)
  const [saveState, setSaveState] = React.useState<SaveState>("idle")

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = React.useRef<{ scene: unknown; files: unknown } | null>(null)

  const save = React.useCallback(
    async (payload: Record<string, unknown>) => {
      setSaveState("saving")
      try {
        const res = await fetch(`/api/boards/${board.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Save failed")
        setSaveState("saved")
      } catch {
        setSaveState("error")
      }
    },
    [board.id]
  )

  // Excalidraw fires onChange on every pointer move; debounce hard and only
  // ever keep the latest scene.
  const handleChange = React.useCallback(
    (elements: readonly unknown[], appState: unknown, files: unknown) => {
      const state = appState as Record<string, unknown>

      pendingRef.current = {
        scene: {
          elements,
          // Viewport and per-user UI state would make every cursor move a diff.
          appState: {
            viewBackgroundColor: state.viewBackgroundColor,
            gridSize: state.gridSize,
          },
        },
        files,
      }

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) void save(pendingRef.current)
      }, AUTOSAVE_DELAY)
    },
    [save]
  )

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const commitTitle = React.useCallback(() => {
    const next = title.trim()
    if (!next || next === board.title) return
    void save({ title: next })
  }, [title, board.title, save])

  const handleDelete = React.useCallback(async () => {
    await fetch(`/api/boards/${board.id}`, { method: "DELETE" })
    router.push("/boards")
    router.refresh()
  }, [board.id, router])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 pb-3">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
          <Link href="/boards" aria-label="Back to boards">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          aria-label="Board title"
          className="h-8 max-w-xs border-transparent bg-transparent px-2 text-[15px] font-semibold shadow-none focus-visible:border-input focus-visible:bg-background"
        />

        <SaveIndicator state={saveState} />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive ml-auto"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
        <Excalidraw
          initialData={{
            elements: (board.scene?.elements ?? []) as never,
            appState: (board.scene?.appState ?? {}) as never,
            files: (board.files ?? {}) as never,
            scrollToContent: true,
          }}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null

  const config = {
    saving: { icon: Loader2, text: "Saving…", spin: true, tone: "" },
    saved: { icon: Check, text: "Saved", spin: false, tone: "text-emerald-600" },
    error: {
      icon: AlertCircle,
      text: "Not saved — retrying on next edit",
      spin: false,
      tone: "text-destructive",
    },
  }[state]

  const Icon = config.icon

  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-1.5 text-xs",
        config.tone
      )}
    >
      <Icon className={cn("size-3.5", config.spin && "animate-spin")} />
      {config.text}
    </span>
  )
}
