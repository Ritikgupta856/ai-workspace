"use client"

import * as React from "react"
import {
  MoreHorizontal,
  Eye,
  PenLine,
  Copy,
  ArrowRight,
  Archive,
  Trash2,
  Inbox,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface TaskCardMenuProps {
  taskId: string
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onMove?: (id: string) => void
  onAddToBacklog?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TaskCardMenu({
  taskId,
  onView,
  onEdit,
  onDuplicate,
  onMove,
  onAddToBacklog,
  onArchive,
  onDelete,
}: TaskCardMenuProps) {
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
        <DropdownMenuItem onClick={() => onView?.(taskId)}>
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(taskId)}>
          <PenLine className="size-4" />
          Edit Task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(taskId)}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove?.(taskId)}>
          <ArrowRight className="size-4" />
          Move To...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddToBacklog?.(taskId)}>
          <Inbox className="size-4" />
          Add to Backlog
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onArchive?.(taskId)}>
          <Archive className="size-4" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.(taskId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
