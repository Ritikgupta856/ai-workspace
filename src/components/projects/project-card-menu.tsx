"use client"

import {
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  MoreHorizontal,
  PenLine,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import type { ProjectStatus } from "@/lib/projects"

export interface ProjectCardMenuProps {
  projectId: string
  status: ProjectStatus
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onStatusChange?: (id: string, status: ProjectStatus) => void
  onDelete?: (id: string) => void
}

export function ProjectCardMenu({
  projectId,
  status,
  onView,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ProjectCardMenuProps) {
  const isArchived = status === "ARCHIVED"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8"
          aria-label="Project actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onView?.(projectId)}>
          <Eye className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(projectId)}>
          <PenLine className="size-4" />
          Edit project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(projectId)}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status is a real column, so it's a radio group rather than a
            one-way "Archive" that couldn't be undone. */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Status
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(value) =>
            onStatusChange?.(projectId, value as ProjectStatus)
          }
        >
          {Object.entries(PROJECT_STATUS_CONFIG)
            .filter(([key]) => key !== "ARCHIVED")
            .map(([key, config]) => {
              const Icon = config.icon
              return (
                <DropdownMenuRadioItem key={key} value={key}>
                  <Icon className="size-4" />
                  {config.label}
                </DropdownMenuRadioItem>
              )
            })}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            onStatusChange?.(projectId, isArchived ? "ACTIVE" : "ARCHIVED")
          }
        >
          {isArchived ? (
            <>
              <ArchiveRestore className="size-4" />
              Restore from archive
            </>
          ) : (
            <>
              <Archive className="size-4" />
              Archive
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete?.(projectId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
