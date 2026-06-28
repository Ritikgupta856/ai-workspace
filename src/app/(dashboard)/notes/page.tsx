"use client"

import * as React from "react"
import { Plus, LayoutGrid, List, Filter, FileText, Pin, MoreHorizontal } from "lucide-react"
import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import { NoteCard, type Note } from "@/components/notes/note-card"
import { NoteDialog } from "@/components/notes/note-dialog"
import { fetchNotes, createNote, deleteNote } from "@/lib/api/note"

const filterOptions = [
  { value: "all", label: "All Notes" },
  { value: "mine", label: "My Notes" },
  { value: "shared", label: "Shared" },
  { value: "archived", label: "Archived" },
]

export default function NotesPage() {
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [viewMode, setViewMode] = React.useState("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [notes, setNotes] = React.useState<Note[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchNotes()
      .then(setNotes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredNotes = React.useMemo(() => {
    let result = notes

    if (activeFilter === "mine") {
      result = result.filter((n) => n.author === "Ritik Gupta")
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

    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [activeFilter, searchQuery, notes])

  const pinnedNotes = filteredNotes.filter((n) => n.pinned)
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned)

  async function handleCreate(data: { title: string; tags: string[] }) {
    const optimistic: Note = {
      id: "temp-" + Date.now(),
      title: data.title,
      preview: "",
      tags: data.tags,
      author: "You",
      updatedAt: new Date().toISOString(),
      pinned: false,
    }
    setNotes((prev) => [optimistic, ...prev])
    try {
      const created = await createNote({ title: data.title, tags: data.tags })
      setNotes((prev) => prev.map((n) => (n.id === optimistic.id ? created : n)))
    } catch {
      setNotes((prev) => prev.filter((n) => n.id !== optimistic.id))
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      await deleteNote(id)
    } catch {
      const fetched = await fetchNotes()
      setNotes(fetched)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeading
          title="Notes"
          description="Write, organize, and share knowledge across your workspace."
        />
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search notes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New Note
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                activeFilter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="size-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="size-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <Filter className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No notes found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or create a new note.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-8">
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pinned
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {pinnedNotes.length > 0 && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                All Notes
              </h3>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unpinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-1">
                      {note.title}
                    </h3>
                    {note.pinned && (
                      <Pin className="size-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                    {note.preview}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <Avatar className="size-4">
                      <AvatarFallback className="text-[7px]">
                        {getInitials(note.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{note.author}</span>
                    <span>{formatUpdatedDate(note.updatedAt)}</span>
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="size-7">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      {note.pinned ? (
                        <DropdownMenuItem>Unpin</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem>Pin to top</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(note.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
        onSuccess={handleCreate}
      />
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
