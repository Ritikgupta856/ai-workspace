"use client"

import * as React from "react"
import { ArrowLeft, Star, Share2, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TaskDetailsHeaderProps {
  title: string
  favorite: boolean
  onFavorite?: () => void
  onShare?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export function TaskDetailsHeader({
  title,
  favorite,
  onFavorite,
  onShare,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: TaskDetailsHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onFavorite}
          className="rounded-md p-2 transition-colors hover:bg-accent"
        >
          <Star
            className={cn(
              "size-4",
              favorite
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground"
            )}
          />
        </button>

        <Button variant="ghost" size="icon-sm" onClick={onShare}>
          <Share2 className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>Edit Task</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
