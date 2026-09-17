import type { Metadata } from "next"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderKanban,
  Home,
  ListTodo,
  PieChart,
  Plug,
  RefreshCw,
  StickyNote,
  UserRound,
  Users,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getDashboardData, type FocusTask } from "@/lib/dashboard"
import { MetricBar, MetricCard } from "@/components/dashboard/metric-card"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { Section, SectionEmpty, sectionRowClass } from "@/components/dashboard/section"
import { SectionHeader } from "@/components/dashboard/section-header"
import { ActivityRows } from "@/components/projects/project-overview-sections"
import {
  TASK_PRIORITY_PILL,
  TASK_STATUS_CONFIG,
  INTEGRATION_STATUS_CONFIG,
  PROJECT_STATUS_PILL,
  type IntegrationStatusKey,
  type TaskPriorityKey,
  type TaskStatusKey,
  type ProjectStatusKey,
} from "@/lib/constants"
import { Progress } from "@/components/ui/progress"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

export const instant = false

/* ── Row shapes, local to this page ─────────────────────────── */

const pillClass = "inline-flex h-4.5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium leading-none"

function EmptyWithAction({
  message,
  actionLabel,
  href,
}: {
  message: string
  actionLabel: string
  href: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <p className="text-[13px] text-muted-foreground">{message}</p>
      <Link
        href={href}
        className="inline-flex h-7 items-center rounded-lg border border-border/80 px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/60"
      >
        {actionLabel}
      </Link>
    </div>
  )
}

function TaskRow({ task, tone }: { task: FocusTask; tone?: "overdue" }) {
  const priority = TASK_PRIORITY_PILL[task.priority as TaskPriorityKey] ?? TASK_PRIORITY_PILL.LOW

  return (
    <Link href={`/tasks?task=${task.id}`} className={sectionRowClass}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "overdue" ? "bg-destructive" : "bg-muted-foreground/40"
        )}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-foreground">{task.title}</span>
      <span className="hidden min-w-0 max-w-40 truncate text-[13px] text-muted-foreground md:inline">
        {task.project ? `${task.project.icon ?? "📁"} ${task.project.name}` : "No project"}
      </span>
      {task.dueDate && (
        <span
          className={cn(
            "hidden w-16 shrink-0 text-right text-[13px] tabular-nums sm:inline",
            tone === "overdue" ? "font-medium text-destructive" : "text-muted-foreground"
          )}
        >
          {formatDueDate(task.dueDate)}
        </span>
      )}
      <span className={cn(pillClass, priority.className)}>{priority.label}</span>
    </Link>
  )
}

/** Group label inside "Your focus". */
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
        "flex items-center gap-1.5 px-4 pt-2.5 pb-1 text-[11px] font-medium tracking-wider uppercase",
        tone === "danger" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </p>
  )
}

/* Segment colour per task status: solid fills for the stacked bar. */
const STATUS_FILL: Record<TaskStatusKey, string> = {
  TODO: "bg-muted-foreground/35",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
}

const TASK_STATUS_KEYS = Object.keys(TASK_STATUS_CONFIG) as TaskStatusKey[]

/** One stacked bar plus a legend; segments grow from raw counts so the bar always fills exactly. */
function WorkBreakdown({
  byStatus,
  total,
}: {
  byStatus: Partial<Record<TaskStatusKey, number>>
  total: number
}) {
  if (total === 0) {
    return <SectionEmpty>No tasks yet. Create one to see the breakdown here.</SectionEmpty>
  }

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
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

      <div className="mt-3 flex flex-col">
        {TASK_STATUS_KEYS.map((key) => {
          const count = byStatus[key] ?? 0
          const pct = Math.round((count / total) * 100)
          return (
            <div key={key} className="flex h-8 items-center gap-2.5">
              <span className={cn("size-2 shrink-0 rounded-full", STATUS_FILL[key])} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80">
                {TASK_STATUS_CONFIG[key].label}
              </span>
              <span className="text-[13px] font-medium tabular-nums text-foreground">{count}</span>
              <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">{pct}%</span>
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
      href: "/my-work",
      tone: "danger" as const,
    },
    attention.unassignedCount > 0 && {
      icon: UserRound,
      label: `${attention.unassignedCount} task${attention.unassignedCount === 1 ? "" : "s"} unassigned`,
      href: "/my-work",
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
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader icon={Home} title="Home">
        {lastSync && (
          <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border/80 px-3 text-[13px] text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Synced</span> {formatUpdatedDate(lastSync)}
            <RefreshCw className="size-3 shrink-0" />
          </span>
        )}
      </SectionHeader>

      {/* Toolbar: greeting on the left, things that need attention on the right */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {greeting()}, {firstName}
          </span>
          {" — "}
          {workspace?.name ? `here's what's happening in ${workspace.name}.` : "here's what's happening in your workspace."}
        </p>

        {alerts.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {alerts.map((alert) => (
              <Link
                key={alert.label}
                href={alert.href}
                className={cn(
                  "group inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors",
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

      {/* Capped so the grid doesn't stretch across an ultrawide display. */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-5 pt-5 pb-8">
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
            href="/my-work"
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <ActivityChart trend={data.trend} />

            <Section
              icon={ListTodo}
              title="Your focus"
              count={focus.totalAssigned}
              action={{ label: "All tasks", href: "/my-work" }}
            >
              {focus.totalAssigned === 0 ? (
                <EmptyWithAction
                  message="No open tasks are assigned to you."
                  actionLabel="Browse tasks"
                  href="/my-work"
                />
              ) : (
                <>
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
                </>
              )}
            </Section>

            <Section
              icon={FolderKanban}
              title="Active projects"
              count={data.projects.length}
              action={{ label: "All projects", href: "/projects" }}
            >
              {data.projects.length === 0 ? (
                <EmptyWithAction
                  message="Create a project to group tasks, pages and boards together."
                  actionLabel="Create a project"
                  href="/projects"
                />
              ) : (
                data.projects.map((project) => {
                  const status =
                    PROJECT_STATUS_PILL[project.status as ProjectStatusKey] ?? PROJECT_STATUS_PILL.ACTIVE
                  return (
                    <Link key={project.id} href={`/projects/${project.id}/overview`} className={sectionRowClass}>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm leading-none">
                        {project.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-foreground">
                        {project.name}
                      </span>
                      <span className="hidden shrink-0 text-[13px] text-muted-foreground md:inline">
                        {project.doneCount}/{project.taskCount} tasks · {formatUpdatedDate(project.updatedAt)}
                      </span>
                      <span className="hidden w-28 shrink-0 items-center gap-2 sm:flex">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground">
                          {project.progress}%
                        </span>
                      </span>
                      <span className={cn(pillClass, status.className)}>{status.label}</span>
                    </Link>
                  )
                })
              )}
            </Section>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Section
              icon={PieChart}
              title="Work breakdown"
              aside={<span className="text-[13px] text-muted-foreground">{taskBoard.total} tasks</span>}
            >
              <WorkBreakdown byStatus={taskBoard.byStatus} total={taskBoard.total} />
            </Section>

            <Section icon={Users} title="Workspace" action={{ label: "Manage", href: "?settings=members" }}>
              <div className={cn(sectionRowClass, "h-9")}>
                <Users className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 text-[13px] text-foreground/80">
                  {data.memberCount === 1 ? "Member" : "Members"}
                </span>
                <span className="text-sm font-medium tabular-nums text-foreground">{data.memberCount}</span>
              </div>
              <div className={cn(sectionRowClass, "h-9")}>
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                <span className="min-w-0 flex-1 text-[13px] text-foreground/80">Done this week</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {taskBoard.completedThisWeek}
                </span>
              </div>
            </Section>

            <Section icon={Activity} title="Recent activity" count={data.activity.length}>
              <ActivityRows items={data.activity} limit={5} />
            </Section>

            <Section icon={Plug} title="Connected tools" action={{ label: "Manage", href: "?settings=integrations" }}>
              {data.integrations.length === 0 ? (
                <EmptyWithAction
                  message="Connect GitHub to pull work in automatically."
                  actionLabel="Connect a tool"
                  href="?settings=integrations"
                />
              ) : (
                data.integrations.map((integration) => {
                  const status =
                    INTEGRATION_STATUS_CONFIG[integration.status as IntegrationStatusKey] ??
                    INTEGRATION_STATUS_CONFIG.DISCONNECTED
                  return (
                    <div key={integration.id} className={sectionRowClass}>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Plug className="size-3.5 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium leading-5 text-foreground">
                          {integration.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {integration.documentCount} document{integration.documentCount === 1 ? "" : "s"}
                          {integration.lastSyncAt && ` · synced ${formatUpdatedDate(integration.lastSyncAt)}`}
                        </span>
                      </span>
                      <span className={cn(pillClass, status.className)}>{status.label}</span>
                    </div>
                  )
                })
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}
