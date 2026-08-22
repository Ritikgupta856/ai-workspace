import type { Metadata } from "next"
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
  Plug,
  RefreshCw,
  UserRound,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getDashboardData, type FocusTask } from "@/lib/dashboard"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ActivityChart } from "@/components/dashboard/activity-chart"
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
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

/* ── Small presentational helpers, local to this page ─────────
   One card shape, one row shape. Everything on this page is a
   panel with a quiet header and content that runs edge to edge. */

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
    <section
      className={cn(
        "rounded-xl border bg-card shadow-sm ring-1 ring-black/[0.01]",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {action ??
          (href && (
            <Link
              href={href}
              className="text-primary inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
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

/** Row-level hover surface, inset so it reads as a chip rather than a band. */
const rowClass =
  "mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"

function TaskRow({ task, tone }: { task: FocusTask; tone?: "overdue" }) {
  const priority =
    TASK_PRIORITY_CONFIG[task.priority as TaskPriorityKey] ??
    TASK_PRIORITY_CONFIG.LOW

  return (
    <Link href={`/tasks/${task.id}`} className={rowClass}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "overdue" ? "bg-destructive" : "bg-muted-foreground/40"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {task.project
            ? `${task.project.icon ?? "📁"} ${task.project.name}`
            : "No project"}
        </p>
      </div>
      {task.dueDate && (
        <span
          className={cn(
            "shrink-0 text-xs",
            tone === "overdue"
              ? "text-destructive font-medium"
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

/** Group label inside "Your focus" — micro-caps, same as the rest of the app. */
function GroupLabel({
  children,
  tone,
  icon: Icon,
}: {
  children: React.ReactNode
  tone?: "danger"
  icon?: typeof AlertTriangle
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 px-5 pt-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase",
        tone === "danger" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </p>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/* ── Page ───────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Home",
  description: "Your workspace overview — tasks, notes and activity at a glance.",
}

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

  const [data, workspace] = await Promise.all([
    getDashboardData(session.user.id, membership.workspaceId),
    prisma.workspace.findUnique({
      where: { id: membership.workspaceId },
      select: { name: true },
    }),
  ])

  const firstName = session.user.name?.split(" ")[0] ?? "there"
  const { focus, attention, taskBoard } = data

  // Most recent sync across connected tools — omitted entirely when nothing
  // has ever synced, rather than showing a hollow "never".
  const lastSync = data.integrations
    .map((i) => i.lastSyncAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)

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
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Dashboard"
        action={
          lastSync ? (
            <span className="text-muted-foreground inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Synced {formatUpdatedDate(lastSync)}
              <RefreshCw className="size-3" />
            </span>
          ) : null
        }
      />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-[26px] font-semibold tracking-tight">
              {greeting()}, {firstName}
              <span aria-hidden>👋</span>
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {workspace?.name
                ? `Here's what's happening in ${workspace.name}.`
                : "Here's what's happening in your workspace."}
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <Link
                key={alert.label}
                href={alert.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                  alert.tone === "danger"
                    ? "border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
                    : "border-amber-500/25 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                )}
              >
                <alert.icon className="size-3.5" />
                {alert.label}
                <ArrowRight className="size-3" />
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Projects"
            unit="Projects"
            value={data.metrics.projects.value}
            delta={data.metrics.projects.delta}
            ratio={data.metrics.projects.ratio}
            ratioLabel={data.metrics.projects.ratioLabel}
            tone="emerald"
            href="/projects"
          />
          <MetricCard
            label="Tasks"
            unit="Tasks"
            value={data.metrics.tasks.value}
            delta={data.metrics.tasks.delta}
            ratio={data.metrics.tasks.ratio}
            ratioLabel={data.metrics.tasks.ratioLabel}
            tone="violet"
            href="/tasks"
          />
          <MetricCard
            label="Documents"
            unit="Documents"
            value={data.metrics.documents.value}
            delta={data.metrics.documents.delta}
            ratio={data.metrics.documents.ratio}
            ratioLabel={data.metrics.documents.ratioLabel}
            tone="blue"
            href="/projects"
          />
          <MetricCard
            label="Notes"
            unit="Notes"
            value={data.metrics.notes.value}
            delta={data.metrics.notes.delta}
            ratio={data.metrics.notes.ratio}
            ratioLabel={data.metrics.notes.ratioLabel}
            tone="amber"
            href="/notes"
          />
        </div>

        <ActivityChart trend={data.trend} />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Card title="Your focus" href="/tasks" linkLabel="All tasks">
              {focus.totalAssigned === 0 ? (
                <div className="flex flex-col items-center px-5 pt-4 pb-10 text-center">
                  <div className="bg-muted flex size-10 items-center justify-center rounded-xl">
                    <CheckCircle2 className="text-muted-foreground size-4" />
                  </div>
                  <p className="mt-3 text-sm font-medium">You&rsquo;re all clear</p>
                  <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                    No open tasks are assigned to you. Pick something up from the
                    board when you&rsquo;re ready.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/tasks">Browse tasks</Link>
                  </Button>
                </div>
              ) : (
                <div className="pb-3">
                  {focus.overdue.length > 0 && (
                    <>
                      <GroupLabel tone="danger" icon={AlertTriangle}>
                        Overdue
                      </GroupLabel>
                      {focus.overdue.map((task) => (
                        <TaskRow key={task.id} task={task} tone="overdue" />
                      ))}
                    </>
                  )}
                  {focus.dueToday.length > 0 && (
                    <>
                      <GroupLabel icon={CalendarClock}>Due today</GroupLabel>
                      {focus.dueToday.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </>
                  )}
                  {focus.upcoming.length > 0 && (
                    <>
                      <GroupLabel>Up next</GroupLabel>
                      {focus.upcoming.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </Card>

            <Card title="Task overview" href="/tasks" linkLabel="Open board">
              <div className="px-5 pt-1 pb-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  {(Object.keys(TASK_STATUS_CONFIG) as TaskStatusKey[]).map(
                    (key) => {
                      const config = TASK_STATUS_CONFIG[key]
                      const count = taskBoard.byStatus[key] ?? 0
                      const pct =
                        taskBoard.total > 0
                          ? Math.round((count / taskBoard.total) * 100)
                          : 0
                      return (
                        <div key={key}>
                          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                            <config.icon className="size-3.5" />
                            {config.label}
                          </p>
                          <p className="mt-1.5 text-xl font-semibold tabular-nums">
                            {count}
                          </p>
                          <Progress value={pct} className="mt-2 h-1.5" />
                          <p className="text-muted-foreground mt-1.5 text-[11px] tabular-nums">
                            {pct}% of all tasks
                          </p>
                        </div>
                      )
                    }
                  )}
                </div>

                {taskBoard.total === 0 && (
                  <p className="text-muted-foreground mt-5 text-center text-sm">
                    No tasks yet. Create one to see the breakdown here.
                  </p>
                )}
              </div>
            </Card>

            <Card title="Active projects" href="/projects">
              {data.projects.length === 0 ? (
                <p className="text-muted-foreground px-5 pt-2 pb-10 text-center text-sm">
                  No active projects. Create one to get started.
                </p>
              ) : (
                <div className="pb-3">
                  {data.projects.map((project) => {
                    const status =
                      PROJECT_STATUS_CONFIG[project.status] ??
                      PROJECT_STATUS_CONFIG.ACTIVE
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className={rowClass}
                      >
                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border text-base">
                          {project.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {project.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {project.doneCount}/{project.taskCount} tasks ·
                            updated {formatUpdatedDate(project.updatedAt)}
                          </p>
                        </div>
                        <div className="hidden w-28 shrink-0 items-center gap-2 sm:flex">
                          <Progress value={project.progress} className="h-1.5" />
                          <span className="text-muted-foreground text-xs tabular-nums">
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

          <div className="flex flex-col gap-5">
            <ActivityFeed
              variant="card"
              items={data.activity}
              limit={8}
              title="Recent activity"
              emptyMessage="No activity yet. Events appear as your team works."
            />

            <Card title="Connected tools" href="/integrations" linkLabel="Manage">
              {data.integrations.length === 0 ? (
                <div className="flex flex-col items-center px-5 pt-2 pb-8 text-center">
                  <div className="bg-muted flex size-10 items-center justify-center rounded-xl">
                    <Plug className="text-muted-foreground size-4" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Nothing connected</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Connect GitHub to pull work in automatically.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/integrations">Connect a tool</Link>
                  </Button>
                </div>
              ) : (
                <div className="pb-3">
                  {data.integrations.map((integration) => {
                    const status =
                      INTEGRATION_STATUS_CONFIG[
                        integration.status as IntegrationStatusKey
                      ] ?? INTEGRATION_STATUS_CONFIG.DISCONNECTED
                    return (
                      <div key={integration.id} className={rowClass}>
                        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border">
                          <Plug className="text-muted-foreground size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {integration.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
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

            <Card title="Workspace" href="/members" linkLabel="Manage">
              <div className="grid grid-cols-2 gap-3 px-5 pt-1 pb-5">
                <div className="rounded-lg border bg-muted/30 px-4 py-3">
                  <p className="text-2xl font-semibold tabular-nums">
                    {data.memberCount}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {data.memberCount === 1 ? "Member" : "Members"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 px-4 py-3">
                  <p className="text-2xl font-semibold tabular-nums">
                    {taskBoard.completedThisWeek}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Done this week
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
