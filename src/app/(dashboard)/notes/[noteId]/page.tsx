"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Edit3,
  MoreHorizontal,
  Pin,
  Tag,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Kbd } from "@/components/ui/kbd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDateTime, formatCreatedDate } from "@/lib/date"
import { downloadNoteMarkdown, readingStats } from "@/lib/notes"
import { NoteDialog } from "@/components/notes/note-dialog"
import {
  NoteActionsMenu,
  type Note,
  type NoteActionHandlers,
} from "@/components/notes/note-card"
import { cn } from "@/lib/utils"
import {
  fetchNote,
  updateNote,
  deleteNote,
  duplicateNote,
} from "@/lib/api/note"

const AUTOSAVE_DELAY = 1200

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.noteId as string

  const [note, setNote] = React.useState<Note | null>(null)
  const [content, setContent] = React.useState("")
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchNote(noteId)
      .then((data) => {
        setNote(data)
        setContent(data.content ?? "")
        setDirty(false)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [noteId])

  // Keep the latest content in a ref so the save function stays stable and the
  // debounce timer never captures a stale value.
  const contentRef = React.useRef(content)
  contentRef.current = content

  const save = React.useCallback(async () => {
    if (!noteId) return
    setSaving(true)
    try {
      const updated = await updateNote(noteId, { content: contentRef.current })
      setNote(updated)
      setDirty(false)
      setLastSavedAt(new Date())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save note")
    } finally {
      setSaving(false)
    }
  }, [noteId])

  // Autosave: the old page only saved on an explicit button press, so a
  // navigation mid-edit silently lost the work.
  React.useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(save, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [content, dirty, save])

  // Cmd/Ctrl+S saves immediately.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (dirty) save()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dirty, save])

  // Warn on tab close while a save is still pending.
  React.useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  async function handleEditMeta(data: { title: string; tags: string[] }) {
    if (!note) return
    try {
      const updated = await updateNote(note.id, data)
      setNote(updated)
      toast.success("Note updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update note")
    }
  }

  const handlers: NoteActionHandlers = {
    onEdit: () => setDialogOpen(true),

    onTogglePin: async (target) => {
      const next = !target.pinned
      setNote((prev) => (prev ? { ...prev, pinned: next } : prev))
      try {
        const updated = await updateNote(target.id, { pinned: next })
        setNote(updated)
        toast.success(next ? "Pinned to top" : "Unpinned")
      } catch (err) {
        setNote((prev) => (prev ? { ...prev, pinned: !next } : prev))
        toast.error(err instanceof Error ? err.message : "Failed to update note")
      }
    },

    onDuplicate: async (target) => {
      try {
        const copy = await duplicateNote({ ...target, content })
        toast.success("Note duplicated")
        router.push(`/notes/${copy.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate")
      }
    },

    onDelete: () => setConfirmDelete(true),

    onExport: (target) => {
      downloadNoteMarkdown({
        title: target.title,
        content,
        tags: target.tags,
        author: target.author,
        updatedAt: target.updatedAt,
      })
      toast.success("Downloaded as Markdown")
    },

    onCopyLink: async (target) => {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/notes/${target.id}`
        )
        toast.success("Link copied")
      } catch {
        toast.error("Couldn't copy link")
      }
    },
  }

  async function handleDelete() {
    if (!note) return
    try {
      await deleteNote(note.id)
      toast.success("Note deleted")
      router.push("/notes")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-sm text-muted-foreground">Loading note...</p>
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-destructive">
        {error ?? "Note not found"}
      </div>
    )
  }

  const stats = readingStats(content)

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => router.push("/notes")}
            aria-label="Back to notes"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight">
                {note.title}
              </h1>
              {note.pinned && (
                <Pin className="size-3.5 shrink-0 fill-current text-primary" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.words} words · {stats.minutes} min read
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Autosave status, so the save button isn't the only feedback */}
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs",
              saving
                ? "text-muted-foreground"
                : dirty
                  ? "text-amber-600"
                  : "text-muted-foreground/70"
            )}
          >
            {saving ? (
              <>
                <Spinner className="size-3" />
                Saving…
              </>
            ) : dirty ? (
              <>
                Unsaved
                <Kbd className="hidden sm:inline-flex">⌘S</Kbd>
              </>
            ) : (
              <>
                <Check className="size-3" />
                {lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Saved"}
              </>
            )}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Edit3 className="size-3.5" />
            Rename
          </Button>

          <NoteActionsMenu note={note} handlers={{ ...handlers, onEdit: undefined }}>
            <Button variant="outline" size="icon-sm" aria-label="Note actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </NoteActionsMenu>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setDirty(true)
              }}
              placeholder="Start writing… changes save automatically."
              className="min-h-140 w-full flex-1 resize-none border-0 bg-transparent px-5 py-5 text-base leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 xl:px-6"
            />
            <div className="flex items-center justify-between border-t px-5 py-2 text-xs text-muted-foreground xl:px-6">
              <span className="tabular-nums">
                {stats.words} words · {stats.characters} characters
              </span>
              <span className="hidden sm:inline">
                Markdown is preserved on export
              </span>
            </div>
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="w-full shrink-0 xl:w-72">
          <div className="sticky top-0 space-y-4">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-3.5" />
                    Author
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {getInitials(note.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">
                      {note.author}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Created
                  </span>
                  {/* Was showing updatedAt here before createdAt was returned */}
                  <span className="text-sm">
                    {formatCreatedDate(note.createdAt)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    Updated
                  </span>
                  <span className="text-sm">
                    {formatDateTime(note.updatedAt)}
                  </span>
                </div>

                <Separator />

                <div>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="size-3.5" />
                    Tags
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {note.tags.length > 0 ? (
                      note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[11px] font-normal"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDialogOpen(true)}
                        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Add tags
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="edit"
        note={note}
        onSuccess={handleEditMeta}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              &ldquo;{note.title}&rdquo; will be permanently removed. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
