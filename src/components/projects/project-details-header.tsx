"use client"

import {
  Archive,
  ArchiveRestore,
  Clock,
  Copy,
  FileText,
  ListTree,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Puzzle,
  Trash2,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import type { ProjectStatus } from "@/lib/projects"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import {
  getInitials,
  type ProjectTeamMember,
} from "@/components/projects/project-card"

export interface ProjectDetailsData {
  id: string
  name: string
  description: string
  icon: string
  status: ProjectStatus
  progress: number
  taskCount: number
  documentCount: number
  chatCount: number
  integrationCount: number
  members: (ProjectTeamMember & { role?: string; online?: boolean })[]
  createdAt?: string
  updatedAt: string
}

export interface ProjectDetailsHeaderProps {
  project: ProjectDetailsData
  onInvite?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onStatusChange?: (status: ProjectStatus) => void
  onDelete?: () => void
}

export function ProjectDetailsHeader({
  project,
  onInvite,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ProjectDetailsHeaderProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon
  const visibleMembers = project.members.slice(0, 5)
  const remaining = project.members.length - visibleMembers.length
  const isArchived = project.status === "ARCHIVED"

  const stats = [
    { icon: ListTree, value: project.taskCount, label: "tasks" },
    { icon: FileText, value: project.documentCount, label: "docs" },
    { icon: MessageSquare, value: project.chatCount, label: "chats" },
    { icon: Puzzle, value: project.integrationCount, label: "integrations" },
  ]

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
              {project.icon}
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.description || "No description yet."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Status is now a control, not a read-only chip */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "cursor-pointer gap-1.5 px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80",
                      statusConfig.className
                    )}
                  >
                    <StatusIcon className="size-3.5" />
                    {statusConfig.label}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Set status
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={project.status}
                  onValueChange={(v) => onStatusChange?.(v as ProjectStatus)}
                >
                  {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <DropdownMenuRadioItem key={key} value={key}>
                        <Icon className="size-4" />
                        {config.label}
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5" />
                <span className="tabular-nums">{value}</span> {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4 lg:items-end">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="size-9 border-2 border-card">
                      <AvatarImage
                        src={member.image ?? undefined}
                        alt={member.name}
                      />
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
              Invite
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="size-9"
                  aria-label="Project actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <PenLine className="size-4" />
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    onStatusChange?.(isArchived ? "ACTIVE" : "ARCHIVED")
                  }
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore className="size-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="size-4" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex w-full max-w-55 flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2" />
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
