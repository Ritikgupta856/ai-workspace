"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clock,
  Copy,
  Download,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatUpdatedDate } from "@/lib/date"
import { readingStats } from "@/lib/notes"
import { cn } from "@/lib/utils"

export interface Note {
  id: string
  title: string
  preview: string
  content?: string
  tags: string[]
  author: string
  authorId: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface NoteActionHandlers {
  onTogglePin: (note: Note) => void
  onDuplicate: (note: Note) => void
  onDelete: (note: Note) => void
  onExport: (note: Note) => void
  onCopyLink: (note: Note) => void
  onEdit?: (note: Note) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * One menu, used by the grid card, the list row and the detail page — so an
 * action can never exist in one place and silently do nothing in another.
 */
export function NoteActionsMenu({
  note,
  handlers,
  align = "end",
  children,
}: {
  note: Note
  handlers: NoteActionHandlers
  align?: "start" | "end"
  children: React.ReactNode
}) {
  const { onTogglePin, onDuplicate, onDelete, onExport, onCopyLink, onEdit } =
    handlers

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(note)}>
            <Pencil className="size-3.5" />
            Edit note
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onTogglePin(note)}>
          {note.pinned ? (
            <>
              <PinOff className="size-3.5" />
              Unpin
            </>
          ) : (
            <>
              <Pin className="size-3.5" />
              Pin to top
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(note)}>
          <Copy className="size-3.5" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onCopyLink(note)}>
          <Link2 className="size-3.5" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport(note)}>
          <Download className="size-3.5" />
          Download .md
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onDelete(note)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NoteCardProps {
  note: Note
  handlers: NoteActionHandlers
  onTagClick?: (tag: string) => void
}

export function NoteCard({ note, handlers, onTagClick }: NoteCardProps) {
  const stats = readingStats(note.content ?? note.preview)

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
        note.pinned && "border-primary/30 bg-primary/[0.02]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-4 text-primary" />
        </div>

        <div className="flex items-center gap-1">
          {note.pinned && (
            <span
              className="flex size-7 items-center justify-center text-primary"
              title="Pinned"
            >
              <Pin className="size-3.5 fill-current" />
            </span>
          )}
          <NoteActionsMenu note={note} handlers={handlers}>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "size-7 transition-opacity",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              )}
              aria-label={`Actions for ${note.title}`}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </NoteActionsMenu>
        </div>
      </div>

      <Link href={`/notes/${note.id}`} className="mt-4 flex flex-col gap-1.5">
        <h3 className="line-clamp-1 font-semibold leading-snug text-foreground">
          {note.title}
        </h3>
        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
          {note.preview || (
            <span className="italic opacity-70">No content yet</span>
          )}
        </p>
      </Link>

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              onClick={
                onTagClick
                  ? (e) => {
                      e.preventDefault()
                      onTagClick(tag)
                    }
                  : undefined
              }
              className={cn(
                "text-[11px] font-normal",
                onTagClick && "cursor-pointer hover:bg-primary/10 hover:text-primary"
              )}
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge variant="secondary" className="text-[11px] font-normal">
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-5 shrink-0">
            <AvatarFallback className="text-[9px]">
              {getInitials(note.author)}
            </AvatarFallback>
          </Avatar>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="size-3" />
            {formatUpdatedDate(note.updatedAt)}
          </span>
        </div>
        <span className="shrink-0 whitespace-nowrap tabular-nums">
          {stats.words} {stats.words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  )
}
