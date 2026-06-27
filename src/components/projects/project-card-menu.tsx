"use client"

import * as React from "react"
import {
  MoreHorizontal,
  Eye,
  PenLine,
  Copy,
  Star,
  Archive,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface ProjectCardMenuProps {
  projectId: string
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onFavorite?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ProjectCardMenu({
  projectId,
  onView,
  onEdit,
  onDuplicate,
  onFavorite,
  onArchive,
  onDelete,
}: ProjectCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView?.(projectId)}>
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(projectId)}>
          <PenLine className="size-4" />
          Edit Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(projectId)}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFavorite?.(projectId)}>
          <Star className="size-4" />
          Add to Favorites
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive?.(projectId)}>
          <Archive className="size-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.(projectId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
