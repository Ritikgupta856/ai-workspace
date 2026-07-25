import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderKanban,
  Minus,
  NotebookPen,
  Plug,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getDashboardData, type Delta, type FocusTask } from "@/lib/dashboard"
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  INTEGRATION_STATUS_CONFIG,
  type IntegrationStatusKey,
  type TaskPriorityKey,
  type TaskStatusKey,
} from "@/lib/constants"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import { StatusBadge } from "@/components/common/status-badge"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

/* ── Small presentational helpers, local to this page ───────── */

function Card({
  title,
  href,
  linkLabel = "View all",
  children,
  className,
  action,
}: {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action ??
          (href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {linkLabel}
              <ArrowUpRight className="size-3" />
            </Link>
          ))}
      </div>
      {children}
    </section>
  )
}

function DeltaChip({ delta }: { delta: Delta }) {
  // Nothing to compare against — say nothing rather than imply growth.
  if (!delta) {
    return <span className="text-xs text-muted-foreground">No prior data</span>
  }
  if (delta.direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" />
        Flat vs last week
      </span>
    )
  }
  const up = delta.direction === "up"
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        up ? "text-emerald-600" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {delta.percent}%
      <span className="font-normal text-muted-foreground">vs last week</span>
    </span>
  )
}

function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  href,
}: {
  label: string
  value: number
  delta: Delta
  icon: typeof FolderKanban
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="size-4" />
        </div>
        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      <div className="mt-2.5">
        <DeltaChip delta={delta} />
      </div>
    </Link>
  )
}

function TaskRow({ task, tone }: { task: FocusTask; tone?: "overdue" }) {
  const priority =
    TASK_PRIORITY_CONFIG[task.priority as TaskPriorityKey] ??
    TASK_PRIORITY_CONFIG.LOW

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/40"
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "overdue" ? "bg-destructive" : "bg-muted-foreground/40"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {task.project ? `${task.project.icon ?? "📁"} ${task.project.name}` : "No project"}
        </p>
      </div>
      {task.dueDate && (
        <span
          className={cn(
            "shrink-0 text-xs",
            tone === "overdue"
              ? "font-medium text-destructive"
              : "text-muted-foreground"
          )}
        >
          {formatDueDate(task.dueDate)}
        </span>
      )}
      <StatusBadge
        label={priority.label}
        className={cn("shrink-0", priority.className)}
        icon={priority.icon}
      />
    </Link>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/* ── Page ───────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

  const membership =
    (activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({
          where: { userId: session.user.id, workspaceId: activeWorkspaceId },
        })
      : null) ??
    (await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    }))

  if (!membership) redirect("/projects")

  const data = await getDashboardData(session.user.id, membership.workspaceId)

  const firstName = session.user.name?.split(" ")[0] ?? "there"
  const { focus, attention, taskBoard } = data

  const alerts = [
    attention.overdueCount > 0 && {
      icon: AlertTriangle,
      label: `${attention.overdueCount} of your tasks ${attention.overdueCount === 1 ? "is" : "are"} overdue`,
      href: "/tasks",
      tone: "danger" as const,
    },
    attention.unassignedCount > 0 && {
      icon: UserRound,
      label: `${attention.unassignedCount} task${attention.unassignedCount === 1 ? "" : "s"} unassigned`,
      href: "/tasks",
      tone: "warn" as const,
    },
    attention.failedDocs > 0 && {
      icon: FileText,
      label: `${attention.failedDocs} document${attention.failedDocs === 1 ? "" : "s"} failed to process`,
      href: "/projects",
      tone: "warn" as const,
    },
  ].filter(Boolean) as {
    icon: typeof AlertTriangle
    label: string
    href: string
    tone: "danger" | "warn"
  }[]

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {focus.totalAssigned > 0
              ? `You have ${focus.totalAssigned} task${focus.totalAssigned === 1 ? "" : "s"} on your plate.`
              : "Nothing assigned to you right now."}{" "}
            {taskBoard.completedThisWeek > 0 &&
              `${taskBoard.completedThisWeek} completed across the workspace this week.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat">
              <Sparkles className="size-4" />
              Ask Synapse
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/projects">
              New project
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Needs attention — only rendered when something is actually wrong */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <Link
              key={alert.label}
              href={alert.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                alert.tone === "danger"
                  ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
              )}
            >
              <alert.icon className="size-3.5" />
              {alert.label}
              <ArrowRight className="size-3" />
            </Link>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Projects"
          value={data.metrics.projects.value}
          delta={data.metrics.projects.delta}
          icon={FolderKanban}
          href="/projects"
        />
        <MetricCard
          label="Tasks"
          value={data.metrics.tasks.value}
          delta={data.metrics.tasks.delta}
          icon={CheckCircle2}
          href="/tasks"
        />
        <MetricCard
          label="Documents"
          value={data.metrics.documents.value}
          delta={data.metrics.documents.delta}
          icon={FileText}
          href="/projects"
        />
        <MetricCard
          label="Notes"
          value={data.metrics.notes.value}
          delta={data.metrics.notes.delta}
          icon={NotebookPen}
          href="/notes"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Your focus — the thing a dashboard exists for */}
          <Card title="Your focus" href="/tasks" linkLabel="All tasks">
            {focus.totalAssigned === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">You&rsquo;re all clear</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  No open tasks are assigned to you. Pick something up from the
                  board when you&rsquo;re ready.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/tasks">Browse tasks</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {focus.overdue.length > 0 && (
                  <div className="py-1.5">
                    <p className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                      <AlertTriangle className="size-3" />
                      Overdue
                    </p>
                    {focus.overdue.map((task) => (
                      <TaskRow key={task.id} task={task} tone="overdue" />
                    ))}
                  </div>
                )}
                {focus.dueToday.length > 0 && (
                  <div className="py-1.5">
                    <p className="flex items-center gap-1.5 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <CalendarClock className="size-3" />
                      Due today
                    </p>
                    {focus.dueToday.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </div>
                )}
                {focus.upcoming.length > 0 && (
                  <div className="py-1.5">
                    <p className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Up next
                    </p>
                    {focus.upcoming.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Task distribution — real counts, proportional bars */}
          <Card title="Task overview" href="/tasks" linkLabel="Open board">
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                  Object.keys(TASK_STATUS_CONFIG) as TaskStatusKey[]
                ).map((key) => {
                  const config = TASK_STATUS_CONFIG[key]
                  const count = taskBoard.byStatus[key] ?? 0
                  const pct =
                    taskBoard.total > 0
                      ? Math.round((count / taskBoard.total) * 100)
                      : 0
                  return (
                    <div key={key}>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <config.icon className="size-3.5" />
                        {config.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">
                        {count}
                      </p>
                      <Progress value={pct} className="mt-2 h-1.5" />
                      <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                        {pct}% of all tasks
                      </p>
                    </div>
                  )
                })}
              </div>

              {taskBoard.total === 0 && (
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  No tasks yet. Create one to see the breakdown here.
                </p>
              )}
            </div>
          </Card>

          {/* Active projects */}
          <Card title="Active projects" href="/projects">
            {data.projects.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No active projects. Create one to get started.
              </p>
            ) : (
              <div className="divide-y">
                {data.projects.map((project) => {
                  const status =
                    PROJECT_STATUS_CONFIG[project.status] ??
                    PROJECT_STATUS_CONFIG.ACTIVE
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                        {project.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {project.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {project.doneCount}/{project.taskCount} tasks ·
                          updated {formatUpdatedDate(project.updatedAt)}
                        </p>
                      </div>
                      <div className="hidden w-28 shrink-0 items-center gap-2 sm:flex">
                        <Progress value={project.progress} className="h-1.5" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <StatusBadge
                        label={status.label}
                        className={cn("shrink-0", status.className)}
                        icon={status.icon}
                      />
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Real feed, server-rendered so there's no client waterfall */}
          <ActivityFeed
            variant="card"
            items={data.activity}
            limit={8}
            title="Recent activity"
            emptyMessage="No activity yet. Events appear as your team works."
          />

          <Card title="Integrations" href="/integrations">
            {data.integrations.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                  <Plug className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">Nothing connected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect GitHub to pull work in automatically.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/integrations">Connect a tool</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {data.integrations.map((integration) => {
                  const status =
                    INTEGRATION_STATUS_CONFIG[
                      integration.status as IntegrationStatusKey
                    ] ?? INTEGRATION_STATUS_CONFIG.DISCONNECTED
                  return (
                    <div
                      key={integration.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Plug className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {integration.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {integration.documentCount} document
                          {integration.documentCount === 1 ? "" : "s"}
                          {integration.lastSyncAt &&
                            ` · synced ${formatUpdatedDate(integration.lastSyncAt)}`}
                        </p>
                      </div>
                      <StatusBadge
                        label={status.label}
                        className={cn("shrink-0", status.className)}
                        icon={status.icon}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Replaces the old "AI Usage" card, which had no data behind it */}
          <Card title="Workspace" href="/members" linkLabel="Manage">
            <div className="grid grid-cols-2 divide-x">
              <div className="px-5 py-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {data.memberCount}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {data.memberCount === 1 ? "Member" : "Members"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-2xl font-semibold tabular-nums">
                  {taskBoard.completedThisWeek}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Done this week
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
