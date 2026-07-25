"use client"

import { Clock, FileText, ListTree, MessageSquare, Puzzle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import type { ProjectStatus } from "@/lib/projects"
import { formatUpdatedDate } from "@/lib/date"

export interface ProjectTeamMember {
  id: string
  name: string
  email?: string
  image?: string | null
  role?: string
}

export interface ProjectCardData {
  id: string
  name: string
  description: string
  status: ProjectStatus
  icon: string
  progress: number
  taskCount: number
  doneTaskCount: number
  documentCount: number
  chatCount: number
  integrationCount: number
  members: ProjectTeamMember[]
  createdAt: string
  updatedAt: string
}

export interface ProjectCardProps {
  project: ProjectCardData
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onStatusChange?: (id: string, status: ProjectStatus) => void
  onDelete?: (id: string) => void
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
}: ProjectCardProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon
  const visibleMembers = project.members.slice(0, 4)
  const remaining = project.members.length - visibleMembers.length

  const stats = [
    { icon: ListTree, value: project.taskCount, label: "tasks" },
    { icon: FileText, value: project.documentCount, label: "docs" },
    { icon: MessageSquare, value: project.chatCount, label: "chats" },
    { icon: Puzzle, value: project.integrationCount, label: "integrations" },
  ]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(project.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onView?.(project.id)
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all",
        "hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        project.status === "ARCHIVED" && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
            {project.icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight">
              {project.name}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
              {project.description || (
                <span className="italic opacity-70">No description</span>
              )}
            </p>
          </div>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <ProjectCardMenu
            projectId={project.id}
            status={project.status}
            onView={onView}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        </div>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "w-fit gap-1 px-2 py-0.5 text-[11px] font-medium",
          statusConfig.className
        )}
      >
        <StatusIcon className="size-3" />
        {statusConfig.label}
      </Badge>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">
            {project.doneTaskCount}/{project.taskCount} · {project.progress}%
          </span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {stats.map(({ icon: Icon, value, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon className="size-3.5" />
            <span className="tabular-nums">{value}</span> {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex -space-x-2">
          {visibleMembers.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar className="size-7 border-2 border-background">
                  <AvatarImage src={member.image ?? undefined} alt={member.name} />
                  <AvatarFallback className="text-[10px]">
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
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
              +{remaining}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {formatUpdatedDate(project.updatedAt)}
        </div>
      </div>
    </div>
  )
}
