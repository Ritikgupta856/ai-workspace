"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  Edit3,
  Trash2,
  MoreHorizontal,
  Pin,
  Save,
  User,
  CalendarDays,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime, formatCreatedDate } from "@/lib/date"
import { NoteDialog } from "@/components/notes/note-dialog"
import { cn } from "@/lib/utils"
import { fetchNote, updateNote, deleteNote } from "@/lib/api/note"
import type { Note } from "@/components/notes/note-card"

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
  const [saved, setSaved] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchNote(noteId)
      .then((data) => {
        setNote(data)
        setContent(data.content ?? "")
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [noteId])

  async function handleSave() {
    if (!note || saving) return
    setSaving(true)
    try {
      const updated = await updateNote(note.id, { content })
      setNote(updated)
      setSaved(true)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(data: { title: string; tags: string[] }) {
    if (!note) return
    const updated = await updateNote(note.id, { title: data.title, tags: data.tags })
    setNote(updated)
  }

  async function handleDelete() {
    if (!note) return
    await deleteNote(note.id)
    router.push("/notes")
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {note.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className={cn(
            "text-xs transition-opacity",
            saved ? "text-muted-foreground/50" : "text-amber-600"
          )}>
            {saving ? "Saving..." : saved ? "Saved" : "Unsaved"}
          </span>
          <Button size="sm" onClick={handleSave} disabled={saved || saving}>
            <Save className="size-3.5" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Edit3 className="size-3.5" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="size-3.5" />
                {note.pinned ? "Unpin" : "Pin to top"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left: Editor */}
        <div className="min-w-0 flex-1">
          <div className="flex h-full flex-col rounded-2xl border bg-card shadow-sm">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setSaved(false)
              }}
              placeholder="Start writing..."
              className="min-h-[600px] w-full resize-none border-0 bg-transparent px-5 py-5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 xl:px-6"
            />
          </div>
        </div>

        {/* Right: Meta sidebar */}
        <div className="w-full shrink-0 xl:w-72">
          <div className="sticky top-6 space-y-4">
            {/* Meta card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-3.5" />
                    Author
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      <AvatarFallback className="text-[9px]">
                        {getInitials(note.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                      {note.author}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Created
                  </span>
                  <span className="text-sm text-foreground">
                    {formatCreatedDate(note.updatedAt)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    Updated
                  </span>
                  <span className="text-sm text-foreground">
                    {formatDateTime(note.updatedAt)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Pin className="size-3.5" />
                    Pinned
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[11px]",
                      note.pinned ? "" : "opacity-50"
                    )}
                  >
                    {note.pinned ? "Yes" : "No"}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <span className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
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
                      <span className="text-sm text-muted-foreground">None</span>
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
        onSuccess={handleEdit}
      />
    </div>
  )
}
