"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Plus,
  Puzzle,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDateTime, formatDueDate, formatUpdatedDate } from "@/lib/date"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { getInitials } from "@/components/projects/project-card"
import {
  fetchProjectDocuments,
  fetchProjectKnowledge,
  fetchProjectMembers,
  fetchProjectTasks,
  updateTaskStatus,
  type ProjectDocument,
  type ProjectKnowledge,
  type ProjectMember,
  type ProjectTask,
} from "@/lib/api/projects"
import { ActivityFeed } from "@/components/activity/activity-feed"

/* ── Shared shells ──────────────────────────────────────────── */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {children}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Inbox
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="size-5" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/**
 * Every tab does the same load/error/empty dance, so it lives here once.
 * `deps` re-runs the fetch the way useEffect deps would.
 */
function useTabData<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loader())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  React.useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

/* ── Tasks ──────────────────────────────────────────────────── */

const TASK_STATUSES = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
] as const

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  LOW: "bg-muted text-muted-foreground",
}

export function ProjectTasksTab({ projectId }: { projectId: string }) {
  const [statusFilter, setStatusFilter] = React.useState("all")
  const { data, loading, error, reload, setData } = useTabData<ProjectTask[]>(
    () => fetchProjectTasks(projectId),
    [projectId]
  )

  async function handleStatusChange(task: ProjectTask, status: string) {
    const previous = data ?? []
    setData(
      previous.map((t) =>
        t.id === task.id ? { ...t, status: status as ProjectTask["status"] } : t
      )
    )
    try {
      await updateTaskStatus(task.id, status)
      toast.success("Task updated")
    } catch (err) {
      setData(previous)
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  if (loading) return <Loading label="Loading tasks..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const tasks = data ?? []
  const visible =
    statusFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter)

  const counts = TASK_STATUSES.map((s) => ({
    ...s,
    count: tasks.filter((t) => t.status === s.value).length,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
            <span className="ml-1 text-xs tabular-nums opacity-60">
              {tasks.length}
            </span>
          </Button>
          {counts.map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
              <span className="ml-1 text-xs tabular-nums opacity-60">
                {s.count}
              </span>
            </Button>
          ))}
        </div>
        <Button size="sm" asChild>
          <Link href="/tasks">
            <Plus className="size-4" />
            New task
          </Link>
        </Button>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={CircleDashed}
            title={tasks.length === 0 ? "No tasks yet" : "Nothing in this status"}
            description={
              tasks.length === 0
                ? "Create tasks to track the work in this project."
                : "Try a different status filter."
            }
            action={
              tasks.length === 0 ? (
                <Button size="sm" asChild>
                  <Link href="/tasks">
                    <Plus className="size-4" />
                    New task
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y">
            {visible.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="min-w-0 flex-1"
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      task.status === "DONE" &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "px-1.5 py-0 text-[10px] font-medium",
                        PRIORITY_STYLES[task.priority]
                      )}
                    >
                      {task.priority}
                    </Badge>
                    {task.dueDate && <span>{formatDueDate(task.dueDate)}</span>}
                    {task.labels.slice(0, 2).map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] font-normal"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </Link>

                {task.assignee ? (
                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={task.assignee.image ?? undefined}
                      alt={task.assignee.name}
                    />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Unassigned
                  </span>
                )}

                <Select
                  value={task.status}
                  onValueChange={(v) => handleStatusChange(task, v)}
                >
                  <SelectTrigger className="h-8 w-32 shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ── Documents ──────────────────────────────────────────────── */

const DOC_STATUS: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  COMPLETED: {
    label: "Indexed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Processing",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Loader2,
  },
  PENDING: {
    label: "Queued",
    className: "bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
}

export function ProjectDocumentsTab({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useTabData<ProjectDocument[]>(
    () => fetchProjectDocuments(projectId),
    [projectId]
  )

  if (loading) return <Loading label="Loading documents..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const documents = data ?? []

  return (
    <Panel>
      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload specs or PDFs from chat and they'll be parsed, indexed and searchable here."
        />
      ) : (
        <div className="divide-y">
          {documents.map((doc) => {
            const status = DOC_STATUS[doc.processingStatus] ?? DOC_STATUS.PENDING
            const StatusIcon = status.icon
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {doc.contentType} · added {formatUpdatedDate(doc.createdAt)}
                    {doc.source && ` · via ${doc.source.name}`}
                  </p>
                  {doc.processingStatus === "FAILED" && doc.processingError && (
                    <p className="mt-1 text-xs text-destructive">
                      {doc.processingError}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 gap-1 px-2 py-0.5 text-[11px] font-medium",
                    status.className
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "size-3",
                      doc.processingStatus === "PROCESSING" && "animate-spin"
                    )}
                  />
                  {status.label}
                </Badge>
                {doc.sourceUrl && (
                  <Button variant="ghost" size="icon-sm" asChild>
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${doc.title}`}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

/* ── Members ────────────────────────────────────────────────── */

export function ProjectMembersTab({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useTabData(
    () => fetchProjectMembers(projectId),
    [projectId]
  )

  if (loading) return <Loading label="Loading members..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const members: ProjectMember[] = data?.members ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Honest about how access works, rather than implying per-project roles */}
      <p className="text-xs text-muted-foreground">
        Everyone in the workspace can access this project. Counts below are for
        this project only.
        {data && data.unassignedTasks > 0 && (
          <> {data.unassignedTasks} task(s) are unassigned.</>
        )}
      </p>

      <Panel>
        <div className="divide-y">
          {members.map((member) => {
            const roleConfig = MEMBER_ROLE_CONFIG[member.role as MemberRoleKey]
            const RoleIcon = roleConfig?.icon
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={member.image ?? undefined} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-4 text-xs text-muted-foreground sm:flex">
                  <span className="tabular-nums">
                    {member.openTasks} open
                  </span>
                  <span className="tabular-nums">
                    {member.completedTasks} done
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 gap-1 text-[11px] font-medium",
                    roleConfig?.className
                  )}
                >
                  {RoleIcon && <RoleIcon className="size-3" />}
                  {roleConfig?.label ?? member.role}
                </Badge>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* ── Activity ───────────────────────────────────────────────── */

export function ProjectActivityTab({ projectId }: { projectId: string }) {
  // Fetching, pagination and row rendering all live in ActivityFeed now.
  return (
    <ActivityFeed
      variant="list"
      scope={{ projectId }}
      emptyMessage="Project events show up here as your team creates and updates work."
    />
  )
}

/* ── Knowledge ──────────────────────────────────────────────── */

export function ProjectKnowledgeTab({ projectId }: { projectId: string }) {
  const [search, setSearch] = React.useState("")
  const [query, setQuery] = React.useState("")

  const { data, loading, error, reload } = useTabData<ProjectKnowledge>(
    () => fetchProjectKnowledge(projectId, query),
    [projectId, query]
  )

  if (loading) return <Loading label="Loading knowledge..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const knowledge = data

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Indexed chunks", value: knowledge?.totalChunks ?? 0 },
          { label: "Documents indexed", value: knowledge?.indexedDocuments ?? 0 },
          { label: "Still processing", value: knowledge?.pendingDocuments ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(search)
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indexed passages..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <Panel>
        {!knowledge || knowledge.chunks.length === 0 ? (
          <EmptyState
            icon={Brain}
            title={query ? "No passages match" : "Nothing indexed yet"}
            description={
              query
                ? "Try different wording — this searches the indexed text, not the file names."
                : "Attach documents to this project. Once processed, their passages become searchable and citable."
            }
          />
        ) : (
          <div className="divide-y">
            {knowledge.chunks.map((chunk) => (
              <div key={chunk.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {chunk.sourceTitle}
                  </p>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1.5 py-0 text-[10px] font-normal"
                  >
                    #{chunk.chunkIndex}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-foreground/90">
                  {chunk.excerpt}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ── Integrations ───────────────────────────────────────────── */

export function ProjectIntegrationsTab({
  integrations,
}: {
  integrations: { id: string; name: string; type: string; connected: boolean }[]
}) {
  return (
    <Panel>
      {integrations.length === 0 ? (
        <EmptyState
          icon={Puzzle}
          title="No integrations connected"
          description="Connect GitHub, Slack, Notion or Linear to pull work into this workspace."
          action={
            <Button size="sm" asChild>
              <Link href="/integrations">Browse integrations</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Puzzle className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{integration.name}</p>
                <p className="text-xs text-muted-foreground">{integration.type}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 gap-1 text-[11px] font-medium",
                  integration.connected
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    integration.connected ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
                {integration.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
