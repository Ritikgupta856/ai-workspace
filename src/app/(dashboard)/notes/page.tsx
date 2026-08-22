"use client"

import * as React from "react"
import { FileText, Link2, MoreHorizontal, Pin, Plus, StickyNote } from "lucide-react"
import { toast } from "sonner"

import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import { downloadNoteMarkdown } from "@/lib/notes"
import {
  NoteActionsMenu,
  type Note,
  type NoteActionHandlers,
} from "@/components/notes/note-card"
import { NoteDialog } from "@/components/notes/note-dialog"
import {
  fetchNotes,
  createNote,
  deleteNote,
  duplicateNote,
  updateNote,
} from "@/lib/api/note"

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const [notes, setNotes] = React.useState<Note[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Note | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Note | null>(null)
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchNotes()
      .then(({ notes }) => {
        setNotes(notes)
        setSelectedNoteId((prev) => prev ?? notes[0]?.id ?? null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // "N" opens the new-note dialog, matching the rest of the app's keyboard
  // affordances. It is ignored while typing in an input.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return
      }
      e.preventDefault()
      setEditing(null)
      setDialogOpen(true)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filteredNotes = React.useMemo(() => {
    let result = notes

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.preview.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [notes, searchQuery])

  React.useEffect(() => {
    if (filteredNotes.length === 0) {
      if (selectedNoteId !== null) setSelectedNoteId(null)
      return
    }

    const stillVisible = filteredNotes.some((note) => note.id === selectedNoteId)
    if (!stillVisible) setSelectedNoteId(filteredNotes[0].id)
  }, [filteredNotes, selectedNoteId])

  const selectedNote = React.useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  )

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  function saveNoteContent(noteId: string, content: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      try {
        const updated = await updateNote(noteId, { content })
        setNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save note")
      }
    }, 900)
  }

  async function handleSubmitDialog(data: { title: string; tags: string[] }) {
    if (editing) {
      const previous = editing
      setNotes((prev) =>
        prev.map((n) =>
          n.id === previous.id
            ? { ...n, title: data.title, tags: data.tags }
            : n
        )
      )
      try {
        const updated = await updateNote(previous.id, data)
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
        if (selectedNoteId === updated.id) setSelectedNoteId(updated.id)
        toast.success("Note updated")
      } catch (err) {
        setNotes((prev) => prev.map((n) => (n.id === previous.id ? previous : n)))
        toast.error(err instanceof Error ? err.message : "Failed to update note")
      }
      setEditing(null)
      return
    }

    try {
      const created = await createNote({
        title: data.title,
        tags: data.tags,
      })
      setNotes((prev) => [created, ...prev])
      setSelectedNoteId(created.id)
      toast.success("Note created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create note")
    }
  }

  const handlers: NoteActionHandlers = {
    onEdit: (note) => {
      setEditing(note)
      setDialogOpen(true)
    },

    onTogglePin: async (note) => {
      const next = !note.pinned
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n))
      )
      try {
        const updated = await updateNote(note.id, { pinned: next })
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
        toast.success(next ? "Pinned to top" : "Unpinned")
      } catch (err) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, pinned: !next } : n))
        )
        toast.error(err instanceof Error ? err.message : "Failed to update note")
      }
    },

    onDuplicate: async (note) => {
      try {
        const copy = await duplicateNote(note)
        setNotes((prev) => [copy, ...prev])
        setSelectedNoteId(copy.id)
        toast.success("Note duplicated")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate")
      }
    },

    onDelete: (note) => setPendingDelete(note),

    onExport: (note) => {
      downloadNoteMarkdown({
        title: note.title,
        content: note.content ?? note.preview,
        tags: note.tags,
        author: note.author,
        updatedAt: note.updatedAt,
      })
      toast.success("Downloaded as Markdown")
    },

    onCopyLink: async (note) => {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/notes/${note.id}`
        )
        toast.success("Link copied")
      } catch {
        toast.error("Couldn't copy link")
      }
    },
  }

  async function confirmDelete() {
    const note = pendingDelete
    if (!note) return

    setPendingDelete(null)
    const snapshot = notes
    const nextNotes = snapshot.filter((n) => n.id !== note.id)
    setNotes(nextNotes)

    if (selectedNoteId === note.id) {
      setSelectedNoteId(nextNotes[0]?.id ?? null)
    }

    try {
      await deleteNote(note.id)
      toast.success("Note deleted")
    } catch (err) {
      setNotes(snapshot)
      if (selectedNoteId === note.id) setSelectedNoteId(note.id)
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <PageHeader
        title="Notes"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            New note
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="size-6" />
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 xl:grid-cols-[322px_minmax(0,1fr)]">
            <aside className="flex min-h-0 max-h-[360px] flex-col border-b bg-white xl:max-h-none xl:border-r xl:border-b-0">
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {filteredNotes.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                    <StickyNote className="size-5 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">No notes found</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a different search, or create a new note.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotes.map((note) => (
                      <NoteSidebarRow
                        key={note.id}
                        note={note}
                        selected={selectedNoteId === note.id}
                        onSelect={setSelectedNoteId}
                        handlers={handlers}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <section className="min-w-0 xl:min-h-0">
              {selectedNote ? (
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
                  <div className="border-b px-5 py-6 sm:px-8 sm:py-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                          {selectedNote.title}
                        </h2>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {selectedNote.pinned && <Pin className="size-3 fill-current text-primary" />}
                          <span>Last updated {formatUpdatedDate(selectedNote.updatedAt)} by {selectedNote.author}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={selectedNote.pinned ? "Unpin note" : "Pin note"}
                          onClick={() => handlers.onTogglePin(selectedNote)}
                        >
                          <Pin className={cn("size-4", selectedNote.pinned && "fill-current text-primary")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Copy note link"
                          onClick={() => handlers.onCopyLink(selectedNote)}
                        >
                          <Link2 className="size-4" />
                        </Button>

                        <NoteActionsMenu note={selectedNote} handlers={handlers}>
                          <Button variant="ghost" size="icon-sm" aria-label="Note actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </NoteActionsMenu>
                      </div>
                    </div>

                    {selectedNote.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {selectedNote.tags.map((tag) => (
                          <span key={tag} className="rounded-md border bg-white px-2 py-1 text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto px-5 py-7 sm:px-8 sm:py-10">
                    <article className="w-full">
                      <Textarea
                        value={selectedNote.content ?? ""}
                        onChange={(event) => {
                          const content = event.target.value
                          setNotes((prev) =>
                            prev.map((note) =>
                              note.id === selectedNote.id ? { ...note, content } : note
                            )
                          )
                          saveNoteContent(selectedNote.id, content)
                        }}
                        placeholder="Write your note here..."
                        className="min-h-[62vh] resize-none border-0 bg-white px-0 py-0 text-[15px] leading-8 shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-base"
                      />
                    </article>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[380px] items-center justify-center bg-white px-6 text-center">
                  <div className="max-w-md">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-white">
                      <StickyNote className="size-6 text-muted-foreground" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold tracking-tight">
                      Select a note to preview it
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Your notes list lives on the left. Choose one and the full note, metadata, and actions will appear here.
                    </p>
                    <div className="mt-5">
                      <Button
                        onClick={() => {
                          setEditing(null)
                          setDialogOpen(true)
                        }}
                      >
                        <Plus className="size-4" />
                        New note
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        mode={editing ? "edit" : "create"}
        note={editing ?? undefined}
        onSuccess={handleSubmitDialog}
      />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              &ldquo;{pendingDelete?.title}&rdquo; will be permanently removed.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NoteSidebarRow({
  note,
  selected,
  onSelect,
  handlers,
}: {
  note: Note
  selected: boolean
  onSelect: (id: string) => void
  handlers: NoteActionHandlers
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-transparent bg-white transition-colors",
        selected
          ? "border-primary/20 bg-primary/[0.06]"
          : "hover:bg-primary/[0.03]"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={() => onSelect(note.id)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors",
              selected && "bg-primary/10 text-primary"
            )}
          >
            <FileText className="size-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="line-clamp-1 font-medium text-foreground">
                {note.title}
              </h3>
              {note.pinned && <Pin className="size-3.5 shrink-0 fill-current text-primary" />}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                {formatUpdatedDate(note.updatedAt)}
              </span>
            </div>
          </div>
        </button>

        <NoteActionsMenu note={note} handlers={handlers}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${note.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </NoteActionsMenu>
      </div>
    </div>
  )
}
