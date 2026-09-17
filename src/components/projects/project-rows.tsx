"use client"

import { Archive, CircleCheck, CircleEllipsis, CirclePlay, type LucideIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { getInitials, type ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"
import { PROJECT_STATUS_PILL } from "@/lib/constants"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

/* ── Config ─────────────────────────────────────────────────── */

// Tinted bands per status, same language as the task list.
const GROUP_CONFIG: Record<
  ProjectStatus,
  { label: string; icon: LucideIcon; band: string; iconClass: string }
> = {
  ACTIVE: {
    label: "Active",
    icon: CirclePlay,
    band: "bg-emerald-50 dark:bg-emerald-950/25",
    iconClass: "text-emerald-500",
  },
  ON_HOLD: {
    label: "On hold",
    icon: CircleEllipsis,
    band: "bg-amber-50 dark:bg-amber-950/25",
    iconClass: "text-amber-500",
  },
  COMPLETED: {
    label: "Completed",
    icon: CircleCheck,
    band: "bg-blue-50 dark:bg-blue-950/25",
    iconClass: "text-blue-500",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    band: "bg-muted/60 dark:bg-muted/40",
    iconClass: "text-muted-foreground",
  },
}

const STATUS_PILL = PROJECT_STATUS_PILL

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]

export interface ProjectGroup {
  key: string
  label: string
  icon: LucideIcon
  band: string
  iconClass: string
  projects: ProjectCardData[]
}

export function groupProjectsByStatus(projects: ProjectCardData[]): ProjectGroup[] {
  return PROJECT_STATUS_ORDER.map((status) => ({
    key: status,
    ...GROUP_CONFIG[status],
    projects: projects.filter((p) => p.status === status),
  })).filter((g) => g.projects.length > 0)
}

export function groupAllProjects(projects: ProjectCardData[]): ProjectGroup[] {
  if (projects.length === 0) return []
  return [{ key: "all", ...GROUP_CONFIG.ARCHIVED, label: "All projects", projects }]
}

/* ── Rows ───────────────────────────────────────────────────── */

// Name · Status · Progress · Tasks · Team · Updated · menu. Tasks/Updated drop
// below xl, Progress/Team below md.
const ROW_GRID = cn(
  "grid items-center px-4",
  "grid-cols-[minmax(0,1fr)_96px_32px]",
  "md:grid-cols-[minmax(0,1fr)_96px_140px_96px_32px]",
  "xl:grid-cols-[minmax(0,1fr)_104px_150px_72px_110px_110px_32px]"
)

function Col({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[13px] text-muted-foreground", className)}>{children}</span>
}

export interface ProjectRowActions {
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onStatusChange: (id: string, status: ProjectStatus) => void
  onDelete: (id: string) => void
}

function ProjectRow({ project, actions }: { project: ProjectCardData; actions: ProjectRowActions }) {
  const pill = STATUS_PILL[project.status]
  const team = project.members.slice(0, 4)
  const remaining = project.members.length - team.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => actions.onView(project.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          actions.onView(project.id)
        }
      }}
      className={cn(
        ROW_GRID,
        "group h-11 cursor-pointer rounded-lg border border-transparent transition-colors hover:border-border hover:bg-muted/40"
      )}
    >
      {/* Name + description */}
      <div className="flex min-w-0 items-center gap-3 pr-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm leading-none">
          {project.icon}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm font-medium leading-5 text-foreground">{project.name}</span>
          {project.description && (
            <span className="hidden truncate text-[13px] text-muted-foreground lg:inline">
              {project.description}
            </span>
          )}
        </span>
      </div>

      {/* Status */}
      <div>
        <span className={cn("inline-flex h-4.5 items-center rounded px-1.5 text-[11px] font-medium leading-none", pill.className)}>
          {pill.label}
        </span>
      </div>

      {/* Progress */}
      <div className="hidden items-center gap-2 pr-4 md:flex">
        <Progress value={project.progress} className="h-1.5 flex-1" />
        <span className="w-8 text-right text-[13px] tabular-nums text-muted-foreground">{project.progress}%</span>
      </div>

      {/* Tasks */}
      <div className="hidden text-[13px] tabular-nums text-foreground/80 xl:block">
        {project.doneTaskCount}/{project.taskCount}
      </div>

      {/* Team */}
      <div className="hidden items-center -space-x-1.5 md:flex">
        {team.map((m) => (
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <Avatar className="size-5.5 ring-2 ring-background">
                <AvatarImage src={m.image ?? undefined} alt={m.name} />
                <AvatarFallback className="bg-muted text-[8px] font-semibold text-foreground">
                  {getInitials(m.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{m.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <span className="flex size-5.5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-2 ring-background">
            +{remaining}
          </span>
        )}
        {team.length === 0 && <span className="text-[13px] text-muted-foreground">—</span>}
      </div>

      {/* Updated */}
      <div className="hidden text-[13px] text-muted-foreground xl:block">{formatUpdatedDate(project.updatedAt)}</div>

      {/* Menu */}
      <div
        className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [&_button]:size-6 [&_button]:rounded-md [&_svg]:size-3.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ProjectCardMenu
          projectId={project.id}
          status={project.status}
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDuplicate={actions.onDuplicate}
          onStatusChange={actions.onStatusChange}
          onDelete={actions.onDelete}
        />
      </div>
    </div>
  )
}

/* ── Grouped list ───────────────────────────────────────────── */

export function ProjectGroupedList({
  groups,
  actions,
}: {
  groups: ProjectGroup[]
  actions: ProjectRowActions
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const Icon = group.icon
        return (
          <section key={group.key} className="flex flex-col">
            <div className={cn("flex h-10 items-center justify-between rounded-lg px-4", group.band)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("size-3.5", group.iconClass)} />
                <span className="font-mono text-xs font-medium text-foreground">{group.label}</span>
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/80 bg-card px-1 font-mono text-[10px] leading-none text-muted-foreground">
                  {group.projects.length}
                </span>
              </div>
            </div>

            <div className={cn(ROW_GRID, "h-8")}>
              <Col>Name</Col>
              <Col>Status</Col>
              <Col className="hidden md:inline">Progress</Col>
              <Col className="hidden xl:inline">Tasks</Col>
              <Col className="hidden md:inline">Team</Col>
              <Col className="hidden xl:inline">Updated</Col>
              <span />
            </div>

            <div className="flex flex-col">
              {group.projects.map((project) => (
                <ProjectRow key={project.id} project={project} actions={actions} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
