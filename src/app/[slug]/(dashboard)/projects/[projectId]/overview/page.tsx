"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { isBefore, startOfToday } from "date-fns"
import { toast } from "sonner"
import { useInvalidateProjects } from "@/lib/query/projects"

import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CircleDashed,
  Clock,
  Copy,
  FileText,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FavoriteButton } from "@/components/common/favorite-button"
import { ThemeToggle } from "@/components/common/theme-menu"
import { SearchCommand } from "@/components/layout/search-command"
import { PersonAvatar } from "@/components/tasks/task-grouped-list"
import {
  ActivityRows,
  DocumentRows,
  HealthRows,
  healthScorePill,
} from "@/components/projects/project-overview-sections"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { ManageProjectMembersDialog } from "@/components/projects/manage-members-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"
import { PROJECT_STATUS_CONFIG, TASK_STATUS_CONFIG } from "@/lib/constants"
import { formatCreatedDate, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { createProject, deleteProject, updateProject } from "@/lib/api/projects"
import { useProjectDashboard, type DeadlineData } from "@/components/projects/project-dashboard-context"

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((s) => ({
  value: s,
  label: PROJECT_STATUS_CONFIG[s].label,
}))

const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: "bg-blue-500",
  ON_HOLD: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
  ARCHIVED: "bg-muted-foreground",
}

// Segment colours for the progress bar, in board order.
const SEGMENTS = [
  { key: "TODO", bar: "bg-slate-400", icon: "text-muted-foreground" },
  { key: "IN_PROGRESS", bar: "bg-amber-500", icon: "text-amber-500" },
  { key: "IN_REVIEW", bar: "bg-violet-500", icon: "text-violet-500" },
  { key: "DONE", bar: "bg-emerald-600", icon: "text-emerald-600" },
] as const

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border/80 bg-card shadow-xs", className)}>{children}</section>
  )
}

function CardHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-5 pt-3 pb-1">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

const linkClass = "text-[13px] text-muted-foreground transition-colors hover:text-foreground"

function PriorityMark({ priority }: { priority: string }) {
  if (priority === "URGENT") return <AlertCircle className="size-3.5 shrink-0 text-red-600" aria-label="Urgent" />
  const Icon = priority === "HIGH" ? SignalHigh : priority === "MEDIUM" ? SignalMedium : SignalLow
  return (
    <Icon
      className={cn("size-3.5 shrink-0", priority === "LOW" ? "text-muted-foreground/60" : "text-foreground/70")}
      aria-label={`${priority.toLowerCase()} priority`}
    />
  )
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-10 items-center gap-3 text-sm">
      <span className="flex w-28 shrink-0 items-center gap-2.5 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2">{children}</span>
    </div>
  )
}

function ComingUpRow({ item, href }: { item: DeadlineData; href: string }) {
  const status = TASK_STATUS_CONFIG[item.status]
  const StatusIcon = status.icon
  const due = new Date(item.dueDate)
  const overdue = isBefore(due, startOfToday())
  const today = item.dueDateLabel === "Today"

  return (
    <Link
      href={href}
      className="flex h-12 items-center gap-3 border-t border-border/70 px-5 transition-colors hover:bg-muted/40"
    >
      <StatusIcon className={cn("size-4 shrink-0", SEGMENTS.find((s) => s.key === item.status)?.icon)} />
      <span className="min-w-0 flex-1 truncate text-sm">{item.taskName}</span>
      <PriorityMark priority={item.priority} />
      <span
        className={cn(
          "w-20 shrink-0 text-right text-[13px] text-muted-foreground",
          overdue && "text-red-600",
          today && "text-amber-600"
        )}
        suppressHydrationWarning
      >
        {item.dueDateLabel}
      </span>
      {item.assignee ? (
        <PersonAvatar name={item.assignee.name} image={item.assignee.image} className="size-6 shrink-0" />
      ) : (
        <span className="size-6 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
      )}
    </Link>
  )
}

export default function ProjectOverviewPage() {
  const invalidateProjects = useInvalidateProjects()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const slug = params.slug as string
  const { projectId, data, setData, reload } = useProjectDashboard()

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [manageMembersOpen, setManageMembersOpen] = React.useState(false)

  // "Manage" in the Members section links to ?manageMembers=1 so it's a real,
  // shareable URL rather than a dead button. This is deliberately a different
  // key from `?settings=`, which NavUser's SettingsQuerySync also watches on
  // every dashboard page — reusing that key opened the workspace Settings
  // dialog instead of this project-scoped one.
  React.useEffect(() => {
    if (searchParams.get("manageMembers") !== "1") return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opens a dialog from a one-shot URL flag
    setManageMembersOpen(true)
    const params = new URLSearchParams(searchParams)
    params.delete("manageMembers")
    const rest = params.toString()
    router.replace(`/${slug}/projects/${projectId}/overview${rest ? `?${rest}` : ""}`)
  }, [searchParams, router, projectId, slug])

  async function handleStatusChange(status: ProjectStatus) {
    const previous = data.project
    setData({ ...data, project: { ...previous, status } })
    try {
      await updateProject(projectId, { status })
      invalidateProjects()
      toast.success(status === "ARCHIVED" ? "Project archived" : "Status updated")
    } catch (err) {
      setData((prev) => (prev ? { ...prev, project: previous } : prev))
      toast.error(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleDuplicate() {
    try {
      const copy = await createProject({
        name: `${data.project.name} (Copy)`,
        description: data.project.description,
        status: data.project.status,
        icon: data.project.icon,
      })
      invalidateProjects()
      toast.success("Project duplicated")
      router.push(`/${slug}/projects/${copy.id}/overview`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(projectId)
      invalidateProjects()
      toast.success("Project deleted")
      router.push(`/${slug}/projects`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
      setDeleting(false)
    }
  }

  function handleEditSuccess(updated: ProjectCardData) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            project: {
              ...prev.project,
              name: updated.name,
              description: updated.description,
              status: updated.status,
              icon: updated.icon,
              updatedAt: updated.updatedAt,
            },
          }
        : prev
    )
  }

  const project = data.project
  const isArchived = project.status === "ARCHIVED"
  const score = healthScorePill(data.health.score)
  const statusConfig = PROJECT_STATUS_CONFIG[project.status]

  const totalTasks = Object.values(data.taskBreakdown).reduce((a, b) => a + b, 0)
  const doneTasks = data.taskBreakdown.DONE
  const overdue = data.health.overdueTasks

  const MAX_AVATARS = 5
  const shownMembers = data.teamMembers.slice(0, MAX_AVATARS)
  const extraMembers = data.teamMembers.length - shownMembers.length

  const iconButton = "size-8 rounded-lg border-border/80 shadow-none"

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Top bar: breadcrumb left, search + theme right */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href={`/${slug}/projects`} className="text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground">
            <span className="text-sm leading-none">{project.icon}</span>
            <span className="truncate">{project.name}</span>
          </span>
        </nav>
        <div className="flex shrink-0 items-center gap-2.5">
          <SearchCommand variant="header" />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-6 pb-12">
        {/* Project title block */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">
              {project.icon}
            </span>
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{project.name}</h1>
            <FavoriteButton
              entityType="PROJECT"
              entityId={project.id}
              initial={data.favorited}
              className="size-8 border-transparent bg-transparent shadow-none hover:bg-accent"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg border-border/80 px-2.5 text-[13px] font-normal shadow-none"
                >
                  <span className={cn("size-1.5 rounded-full", STATUS_DOT[project.status])} />
                  {statusConfig.label}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuRadioGroup
                  value={project.status}
                  onValueChange={(v) => handleStatusChange(v as ProjectStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {shownMembers.length > 0 && (
              <div className="mr-1 hidden items-center -space-x-1.5 sm:flex">
                {shownMembers.map((m) => (
                  <PersonAvatar key={m.id} name={m.name} image={m.image} className="size-7" />
                ))}
                {extraMembers > 0 && (
                  <span className="z-10 flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                    +{extraMembers}
                  </span>
                )}
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className={iconButton}
                  onClick={() => setManageMembersOpen(true)}
                  aria-label="Add member"
                >
                  <UserPlus className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Add member</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" className={iconButton} aria-label="Project actions">
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <PenLine className="size-4" />
                  Edit project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange(isArchived ? "ACTIVE" : "ARCHIVED")}>
                  {isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  {isArchived ? "Restore" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left column */}
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader title="About">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className={cn(linkClass, "inline-flex items-center gap-1.5")}
                >
                  <PenLine className="size-3.5" />
                  Edit
                </button>
              </CardHeader>
              <p className="px-5 pt-1 pb-5 text-[15px] leading-7">
                {project.description || (
                  <span className="text-muted-foreground">No description yet. Add one so the team knows what this is for.</span>
                )}
              </p>
            </Card>

            <Card>
              <CardHeader title="Progress">
                <span className="text-[13px] text-muted-foreground">
                  {doneTasks} of {totalTasks} tasks done
                </span>
              </CardHeader>
              <div className="px-5 pb-5">
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{project.progress}%</span>
                  {overdue > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[13px] text-red-700 dark:bg-red-950/30 dark:text-red-400">
                      <Clock className="size-3.5" />
                      {overdue} overdue
                    </span>
                  )}
                </div>

                <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
                  {SEGMENTS.map((seg) => {
                    const count = data.taskBreakdown[seg.key]
                    if (count === 0) return null
                    return (
                      <div
                        key={seg.key}
                        className={cn("h-full", seg.bar)}
                        style={{ width: `${(count / totalTasks) * 100}%` }}
                        title={`${TASK_STATUS_CONFIG[seg.key].label}: ${count}`}
                      />
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {SEGMENTS.map((seg) => {
                    const Icon = TASK_STATUS_CONFIG[seg.key].icon
                    return (
                      <span key={seg.key} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Icon className={cn("size-3.5", seg.icon)} />
                        {TASK_STATUS_CONFIG[seg.key].label}
                        <span className="font-semibold text-foreground tabular-nums">{data.taskBreakdown[seg.key]}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Coming up">
                <Link href={`/${slug}/projects/${projectId}/tasks`} className={linkClass}>
                  View list
                </Link>
              </CardHeader>
              {data.upcomingDeadlines.length === 0 ? (
                <p className="border-t border-border/70 px-5 py-8 text-center text-[13px] text-muted-foreground">
                  <CalendarClock className="mx-auto mb-2 size-5 text-muted-foreground/50" />
                  Nothing due soon.
                </p>
              ) : (
                <div className="mt-1">
                  {data.upcomingDeadlines.map((item) => (
                    <ComingUpRow
                      key={item.id}
                      item={item}
                      href={`/${slug}/projects/${projectId}/tasks?task=${item.id}`}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Latest documents">
                <Link href={`/${slug}/projects/${projectId}/pages`} className={linkClass}>
                  All pages
                </Link>
              </CardHeader>
              <div className="px-2 pb-2">
                <DocumentRows items={data.latestDocuments} />
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col gap-6">
            <Card>
              <CardHeader title="Details" />
              <div className="flex flex-col px-5 pb-4">
                <DetailRow icon={CircleDashed} label="Status">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-0.5 text-[13px]">
                    <span className={cn("size-1.5 rounded-full", STATUS_DOT[project.status])} />
                    {statusConfig.label}
                  </span>
                </DetailRow>
                <DetailRow icon={Users} label="Members">
                  {shownMembers.length > 0 ? (
                    <>
                      <span className="flex items-center -space-x-1.5">
                        {shownMembers.map((m) => (
                          <PersonAvatar key={m.id} name={m.name} image={m.image} className="size-6" />
                        ))}
                      </span>
                      <span className="text-muted-foreground">{data.teamMembers.length}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">None yet</span>
                  )}
                </DetailRow>
                <DetailRow icon={FileText} label="Documents">
                  {project.documentCount}
                </DetailRow>
                <DetailRow icon={MessageSquare} label="Chats">
                  {project.chatCount}
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Created">
                  <span suppressHydrationWarning>
                    {formatCreatedDate(project.createdAt ?? project.updatedAt)}
                  </span>
                </DetailRow>
                <DetailRow icon={Clock} label="Updated">
                  <span suppressHydrationWarning>{formatUpdatedDate(project.updatedAt)}</span>
                </DetailRow>
              </div>
            </Card>

            <Card>
              <CardHeader title="Project health">
                <span
                  className={cn(
                    "inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium leading-none",
                    score.className
                  )}
                >
                  {score.label}
                </span>
              </CardHeader>
              <div className="px-2 pb-2">
                <HealthRows health={data.health} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Recent activity" />
              <div className="px-2 pb-2">
                <ActivityRows items={data.recentActivity} limit={6} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        project={
          {
            ...data.project,
            progress: data.project.progress,
            doneTaskCount: 0,
            members: data.project.members,
            createdAt: data.project.createdAt ?? data.project.updatedAt,
          } as ProjectCardData
        }
        onSuccess={handleEditSuccess}
      />

      <ManageProjectMembersDialog
        projectId={projectId}
        open={manageMembersOpen}
        onOpenChange={setManageMembersOpen}
        members={data.teamMembers}
        onChanged={reload}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {data.project.name}?</DialogTitle>
            <DialogDescription>
              This removes the project and its {data.project.taskCount} tasks.
              Documents and chats are kept but detached. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Spinner className="size-4" />}
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
