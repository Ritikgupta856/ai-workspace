"use client"

import * as React from "react"
import {
  Star,
  MoreHorizontal,
  UserPlus,
  Clock,
  ListTree,
  FileText,
  MessageSquare,
  Puzzle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PROJECT_STATUS_CONFIG, type ProjectStatusKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import type { ProjectTeamMember } from "@/app/(dashboard)/projects/page"

export interface ProjectDetailsData {
  id: string
  name: string
  description: string
  icon: string
  status: ProjectStatusKey
  progress: number
  taskCount: number
  documentCount: number
  chatCount: number
  integrationCount: number
  members: (ProjectTeamMember & { role?: string; online?: boolean })[]
  updatedAt: string
  favorite: boolean
}

export interface ProjectDetailsHeaderProps {
  project: ProjectDetailsData
  onFavorite?: () => void
  onInvite?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ProjectDetailsHeader({
  project,
  onFavorite,
  onInvite,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: ProjectDetailsHeaderProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon
  const visibleMembers = project.members.slice(0, 5)
  const remaining = project.members.length - 5

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
              {project.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <button
                  type="button"
                  onClick={onFavorite}
                  className="rounded-md p-1 transition-colors hover:bg-accent"
                >
                  <Star
                    className={cn(
                      "size-5",
                      project.favorite
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className={cn(
                "gap-1.5 px-3 py-1 text-xs font-medium",
                statusConfig.className
              )}
            >
              <StatusIcon className="size-3.5" />
              {statusConfig.label}
            </Badge>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ListTree className="size-3.5" />
              <span>{project.taskCount} tasks</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" />
              <span>{project.documentCount} docs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="size-3.5" />
              <span>{project.chatCount} chats</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Puzzle className="size-3.5" />
              <span>{project.integrationCount} integrations</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="size-9 border-2 border-card">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{member.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remaining > 0 && (
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-card bg-muted text-xs text-muted-foreground">
                  +{remaining}
                </div>
              )}
            </div>

            <Button size="sm" onClick={onInvite}>
              <UserPlus className="size-4" />
              <span>Invite</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-9">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>Edit Project</DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onFavorite}>
                  {project.favorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex w-full max-w-[220px] flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2.5" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Updated {formatUpdatedDate(project.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
