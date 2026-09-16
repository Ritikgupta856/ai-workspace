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
  FolderKanban,
  ListTodo,
  Plug,
  RefreshCw,
  StickyNote,
  UserRound,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getDashboardData, type FocusTask } from "@/lib/dashboard"
import { MetricBar, MetricCard } from "@/components/dashboard/metric-card"
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

export const instant = false

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
      className={cn("bg-card flex flex-col rounded-xl border shadow-sm", className)}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
        {action ??
          (href && (
            <Link
              href={href}
              className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs font-medium transition-colors"
            >
              {linkLabel}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ))}
      </div>
      {children}
    </section>
  )
}

/** Row-level hover surface, inset so it reads as a chip rather than a band. */
const rowClass =
  "mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/60"

/** Shared shape for the page's "nothing here yet" panels. */
function PanelEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
}: {
  icon: typeof CheckCircle2
  title: string
  description: string
  actionLabel: string
  href: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 pt-2 pb-8 text-center">
      <div className="bg-muted flex size-10 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm text-balance">
        {description}
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </div>
  )
}

function TaskRow({ task, tone }: { task: FocusTask; tone?: "overdue" }) {
  const priority =
    TASK_PRIORITY_CONFIG[task.priority as TaskPriorityKey] ??
    TASK_PRIORITY_CONFIG.LOW

  return (
    <Link href={`/tasks?task=${task.id}`} className={rowClass}>
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
            "hidden shrink-0 text-xs tabular-nums sm:inline",
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

/* Segment colour per task status. Local to this page: the shared status config
   carries a badge className, which is a pill treatment (background + text +
   ring) and can't be reused as a solid fill. */
const STATUS_FILL: Record<TaskStatusKey, string> = {
  TODO: "bg-muted-foreground/35",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
}

const TASK_STATUS_KEYS = Object.keys(TASK_STATUS_CONFIG) as TaskStatusKey[]

/**
 * Work breakdown: one stacked bar plus a legend.
 *
 * This replaces four separate progress bars, each measuring its status against
 * the same total. They were four views of one composition, drawn as four
 * unrelated widgets — so a status at 40% and one at 35% looked alike and you
 * could not see that together they were most of the work.
 *
 * Segments are sized with `flex-grow` from the raw counts rather than rounded
 * percentages, so the bar always fills exactly and never drifts to 99% or 101%.
 */
function WorkBreakdown({
  byStatus,
  total,
}: {
  byStatus: Partial<Record<TaskStatusKey, number>>
  total: number
}) {
  if (total === 0) {
    return (
      <p className="text-muted-foreground px-5 pt-1 pb-6 text-center text-sm">
        No tasks yet. Create one to see the breakdown here.
      </p>
    )
  }

  return (
    <div className="px-5 pt-1 pb-5">
      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        {TASK_STATUS_KEYS.map((key) => {
          const count = byStatus[key] ?? 0
          if (count === 0) return null
          return (
            <div
              key={key}
              className={STATUS_FILL[key]}
              style={{ flexGrow: count }}
              title={`${TASK_STATUS_CONFIG[key].label}: ${count}`}
            />
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {TASK_STATUS_KEYS.map((key) => {
          const count = byStatus[key] ?? 0
          const pct = Math.round((count / total) * 100)
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STATUS_FILL[key]
                )}
              />
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                {TASK_STATUS_CONFIG[key].label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums">
                {count}
              </span>
              <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px] tabular-nums">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
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
      {/* The greeting IS the page title. It used to sit in the content as a
          second <h1> directly under the header's "Dashboard" — two headings of
          the same size, stacked, saying the same thing. */}
      <PageHeader
        title="Overview"
        action={
          lastSync ? (
            <span className="text-muted-foreground bg-card inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm">
          
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Synced</span>{" "}
              {formatUpdatedDate(lastSync)}
              <RefreshCw className="size-3 shrink-0" />
            </span>
          ) : null
        }
      />

      {/* Capped so the grid doesn't stretch across an ultrawide display, where
          every row turns into a metre-long horizontal scan. */}
      <div className="mx-auto flex w-full max-w-400 flex-1 flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-muted-foreground text-sm">
            {workspace?.name
              ? `Here's what's happening in ${workspace.name}.`
              : "Here's what's happening in your workspace."}
          </p>

          {alerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {alerts.map((alert) => (
                <Link
                  key={alert.label}
                  href={alert.href}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    alert.tone === "danger"
                      ? "border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
                      : "border-amber-500/25 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                  )}
                >
                  <alert.icon className="size-3.5 shrink-0" />
                  {alert.label}
                  <ArrowRight className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <MetricBar>
          <MetricCard
            label="Projects"
            value={data.metrics.projects.value}
            delta={data.metrics.projects.delta}
            ratio={data.metrics.projects.ratio}
            ratioLabel={data.metrics.projects.ratioLabel}
            tone="emerald"
            href="/projects"
            icon={FolderKanban}
          />
          <MetricCard
            label="Tasks"
            value={data.metrics.tasks.value}
            delta={data.metrics.tasks.delta}
            ratio={data.metrics.tasks.ratio}
            ratioLabel={data.metrics.tasks.ratioLabel}
            tone="violet"
            href="/tasks"
            icon={ListTodo}
          />
          <MetricCard
            label="Documents"
            value={data.metrics.documents.value}
            delta={data.metrics.documents.delta}
            ratio={data.metrics.documents.ratio}
            ratioLabel={data.metrics.documents.ratioLabel}
            tone="blue"
            href="/projects"
            icon={FileText}
          />
          <MetricCard
            label="Pages"
            value={data.metrics.notes.value}
            delta={data.metrics.notes.delta}
            ratio={data.metrics.notes.ratio}
            ratioLabel={data.metrics.notes.ratioLabel}
            tone="amber"
            href="/pages"
            icon={StickyNote}
          />
        </MetricBar>

        {/* The chart sits inside the left column rather than full-bleed above
            the grid, so both columns start on the same baseline instead of the
            right column beginning a panel-height lower than the left. */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <ActivityChart trend={data.trend} />

            <Card title="Your focus" href="/tasks" linkLabel="All tasks">
              {focus.totalAssigned === 0 ? (
                <PanelEmpty
                  icon={CheckCircle2}
                  title="You’re all clear"
                  description="No open tasks are assigned to you. Pick something up from the board when you’re ready."
                  actionLabel="Browse tasks"
                  href="/tasks"
                />
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

            <Card title="Active projects" href="/projects">
              {data.projects.length === 0 ? (
                <PanelEmpty
                  icon={FolderKanban}
                  title="No active projects"
                  description="Create a project to group tasks, documents and conversations together."
                  actionLabel="Create a project"
                  href="/projects"
                />
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
                          <span className="text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums">
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

          <div className="flex flex-col gap-4">
            <Card title="Work breakdown" href="/tasks" linkLabel="Open board">
              <WorkBreakdown
                byStatus={taskBoard.byStatus}
                total={taskBoard.total}
              />
            </Card>

            <Card title="Workspace" href="?settings=members" linkLabel="Manage">
              <div className="grid grid-cols-2 gap-3 px-5 pt-1 pb-5">
                <div className="bg-muted/40 rounded-lg border px-4 py-3">
                  <p className="text-2xl leading-none font-semibold tabular-nums">
                    {data.memberCount}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {data.memberCount === 1 ? "Member" : "Members"}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg border px-4 py-3">
                  <p className="text-2xl leading-none font-semibold tabular-nums">
                    {taskBoard.completedThisWeek}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Done this week
                  </p>
                </div>
              </div>
            </Card>

            <ActivityFeed
              variant="card"
              items={data.activity}
              limit={5}
              title="Recent activity"
              emptyMessage="No activity yet. Events appear as your team works."
            />

            <Card title="Connected tools" href="?settings=integrations" linkLabel="Manage">
              {data.integrations.length === 0 ? (
                <PanelEmpty
                  icon={Plug}
                  title="Nothing connected"
                  description="Connect GitHub to pull work in automatically."
                  actionLabel="Connect a tool"
                  href="?settings=integrations"
                />
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
          </div>
        </div>
      </div>
    </div>
  )
}
