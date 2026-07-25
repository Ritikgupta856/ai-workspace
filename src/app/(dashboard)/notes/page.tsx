"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpDown,
  FileText,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pin,
  Plus,
  StickyNote,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Kbd } from "@/components/ui/kbd"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import { downloadNoteMarkdown } from "@/lib/notes"
import {
  NoteActionsMenu,
  NoteCard,
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

type Scope = "all" | "mine" | "pinned"
type SortKey = "updated" | "created" | "title"

const scopes: { value: Scope; label: string }[] = [
  { value: "all", label: "All notes" },
  { value: "mine", label: "My notes" },
  { value: "pinned", label: "Pinned" },
]

const sorts: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title (A–Z)" },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function NotesPage() {
  const [scope, setScope] = React.useState<Scope>("all")
  const [viewMode, setViewMode] = React.useState("grid")
  const [sortKey, setSortKey] = React.useState<SortKey>("updated")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTags, setActiveTags] = React.useState<string[]>([])

  const [notes, setNotes] = React.useState<Note[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Note | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<Note | null>(null)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchNotes()
      .then(({ notes, currentUserId }) => {
        setNotes(notes)
        setCurrentUserId(currentUserId)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // "N" opens the new-note dialog, matching how the rest of the app is driven
  // from the keyboard. Ignored while typing in an input.
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

  const allTags = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const note of notes) {
      for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [notes])

  const filteredNotes = React.useMemo(() => {
    let result = notes

    if (scope === "mine" && currentUserId) {
      result = result.filter((n) => n.authorId === currentUserId)
    } else if (scope === "pinned") {
      result = result.filter((n) => n.pinned)
    }

    if (activeTags.length > 0) {
      result = result.filter((n) => activeTags.every((t) => n.tags.includes(t)))
    }

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
      // Pinned notes float to the top of every sort except the explicit
      // "Pinned" scope, where they're all pinned anyway.
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (sortKey === "title") return a.title.localeCompare(b.title)
      const field = sortKey === "created" ? "createdAt" : "updatedAt"
      return new Date(b[field]).getTime() - new Date(a[field]).getTime()
    })
  }, [notes, scope, currentUserId, activeTags, searchQuery, sortKey])

  const pinnedNotes = filteredNotes.filter((n) => n.pinned)
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned)
  const hasFilters = Boolean(searchQuery.trim()) || activeTags.length > 0

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function clearFilters() {
    setSearchQuery("")
    setActiveTags([])
  }

  /* ── Mutations ──────────────────────────────────────────── */

  async function handleSubmitDialog(data: { title: string; tags: string[] }) {
    if (editing) {
      const previous = editing
      setNotes((prev) =>
        prev.map((n) =>
          n.id === previous.id ? { ...n, title: data.title, tags: data.tags } : n
        )
      )
      try {
        const updated = await updateNote(previous.id, data)
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
        toast.success("Note updated")
      } catch (err) {
        setNotes((prev) => prev.map((n) => (n.id === previous.id ? previous : n)))
        toast.error(err instanceof Error ? err.message : "Failed to update note")
      }
      setEditing(null)
      return
    }

    try {
      const created = await createNote({ title: data.title, tags: data.tags })
      setNotes((prev) => [created, ...prev])
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
        await updateNote(note.id, { pinned: next })
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
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    try {
      await deleteNote(note.id)
      toast.success("Note deleted")
    } catch (err) {
      setNotes(snapshot)
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Notes"
          description="Write, organize, and share knowledge across your workspace."
        />
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search notes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            New note
            <Kbd className="ml-1 hidden sm:inline-flex">N</Kbd>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
          {scopes.map((opt) => {
            const count =
              opt.value === "all"
                ? notes.length
                : opt.value === "pinned"
                  ? notes.filter((n) => n.pinned).length
                  : notes.filter((n) => n.authorId === currentUserId).length
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  scope === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:text-foreground"
                )}
              >
                {opt.label}
                <span className="text-xs tabular-nums opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Tags
                  {activeTags.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-4 min-w-4 justify-center px-1 text-[10px]"
                    >
                      {activeTags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                  {allTags.map(([tag, count]) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={activeTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="flex-1 truncate">{tag}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="size-3.5" />
                <span className="hidden sm:inline">
                  {sorts.find((s) => s.value === sortKey)?.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sorts.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={sortKey === opt.value}
                  onCheckedChange={() => setSortKey(opt.value)}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2 px-2.5">
                <LayoutGrid className="size-4" />
                <span className="sr-only sm:not-sr-only">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 px-2.5">
                <List className="size-4" />
                <span className="sr-only sm:not-sr-only">List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Active filter chips */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered by</span>
          {activeTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {tag}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Body */}
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
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <StickyNote className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">
            {hasFilters || scope !== "all"
              ? "No notes match these filters"
              : "No notes yet"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {hasFilters || scope !== "all"
              ? "Try a different search, or clear the filters."
              : "Capture a decision, a spec or a meeting summary — Synapse can search and cite it later."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {(hasFilters || scope !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearFilters()
                  setScope("all")
                }}
              >
                Clear filters
              </Button>
            )}
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
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-8">
          {scope !== "pinned" && pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Pin className="size-3" />
                Pinned
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    handlers={handlers}
                    onTagClick={toggleTag}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div className="space-y-3">
              {scope !== "pinned" && pinnedNotes.length > 0 && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  All notes
                </h3>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    handlers={handlers}
                    onTagClick={toggleTag}
                  />
                ))}
              </div>
            </div>
          )}

          {scope === "pinned" &&
            pinnedNotes.length > 0 &&
            unpinnedNotes.length === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    handlers={handlers}
                    onTagClick={toggleTag}
                  />
                ))}
              </div>
            )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>

                <Link
                  href={`/notes/${note.id}`}
                  className="min-w-0 flex-1 py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="line-clamp-1 text-sm font-medium">
                      {note.title}
                    </h3>
                    {note.pinned && (
                      <Pin className="size-3 shrink-0 fill-current text-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {note.preview || "No content yet"}
                  </p>
                </Link>

                <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground md:flex">
                  {note.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer text-[10px] font-normal hover:bg-primary/10 hover:text-primary"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <Avatar className="size-4">
                      <AvatarFallback className="text-[7px]">
                        {getInitials(note.author)}
                      </AvatarFallback>
                    </Avatar>
                    {note.author}
                  </span>
                  <span className="w-24 text-right tabular-nums">
                    {formatUpdatedDate(note.updatedAt)}
                  </span>
                </div>

                <NoteActionsMenu note={note} handlers={handlers}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                    aria-label={`Actions for ${note.title}`}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </NoteActionsMenu>
              </div>
            ))}
          </div>
        </div>
      )}

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
