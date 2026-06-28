"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Pin, MoreHorizontal, Clock } from "lucide-react"
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
import { cn } from "@/lib/utils"

export interface Note {
  id: string
  title: string
  preview: string
  content?: string
  tags: string[]
  author: string
  updatedAt: string
  pinned: boolean
}

interface NoteCardProps {
  note: Note
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow",
        note.pinned && "ring-1 ring-primary/10"
      )}
    >
      {note.pinned && (
        <div className="absolute right-3 top-3 text-primary/60">
          <Pin className="size-3.5" />
        </div>
      )}

      <Link href={`/notes/${note.id}`} className="flex flex-col gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-semibold leading-snug text-foreground line-clamp-1">
            {note.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {note.preview}
          </p>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="size-5">
            <AvatarFallback className="text-[9px]">
              {getInitials(note.author)}
            </AvatarFallback>
          </Avatar>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatUpdatedDate(note.updatedAt)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
            >
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
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[11px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
