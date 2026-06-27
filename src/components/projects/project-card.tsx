"use client"

import * as React from "react"
import { Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { PROJECT_STATUS_CONFIG, type ProjectStatusKey } from "@/lib/constants"
import { formatUpdatedDate } from "@/lib/date"
import type { ProjectTeamMember } from "@/app/(dashboard)/projects/page"

export interface ProjectCardData {
  id: string
  name: string
  description: string
  status: ProjectStatusKey
  progress: number
  taskCount: number
  documentCount: number
  chatCount: number
  integrationCount: number
  members: ProjectTeamMember[]
  updatedAt: string
  favorite: boolean
  icon: string
}

export interface ProjectCardProps {
  project: ProjectCardData
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onFavorite?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

function getInitials(name: string): string {
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
  onFavorite,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon
  const visibleMembers = project.members.slice(0, 4)
  const remaining = project.members.length - 4

  return (
    <div
      onClick={() => onView?.(project.id)}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-lg">
            {project.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-foreground">
              {project.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFavorite?.(project.id)
            }}
            className={cn(
              "rounded-md p-1 transition-colors hover:bg-accent",
              project.favorite && "text-amber-500"
            )}
          >
            <Star
              className={cn(
                "size-4",
                project.favorite ? "fill-amber-500" : "text-muted-foreground"
              )}
            />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <ProjectCardMenu
              projectId={project.id}
              onView={onView}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onFavorite={onFavorite}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn("gap-1 px-2 py-0.5 text-[11px] font-medium", statusConfig.className)}
        >
          <StatusIcon className="size-3" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{project.taskCount} Tasks</span>
        <span>{project.documentCount} Documents</span>
        <span>{project.chatCount} Chats</span>
        <span>{project.integrationCount} Integrations</span>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex -space-x-2">
          {visibleMembers.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar className="size-7 border-2 border-background">
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
