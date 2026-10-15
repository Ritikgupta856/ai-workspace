"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock,
  FolderKanban,
  Home,
  LoaderCircle,
  Plus,
  SignalHigh,
  SignalLow,
  SignalMedium,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/common/theme-menu"
import { SearchCommand } from "@/components/layout/search-command"
import { SectionHeader } from "@/components/dashboard/section-header"
import { PersonAvatar } from "@/components/tasks/task-grouped-list"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { InviteMemberDialog } from "@/components/members/invite-member-dialog"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { HomeData, HomeProjectState, HomeTask } from "@/lib/home"

type TaskTab = "upcoming" | "overdue" | "completed"

const TABS: { value: TaskTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
]

const PROJECT_STATE: Record<HomeProjectState, { label: string; dot: string }> = {
  IN_PROGRESS: { label: "In progress", dot: "bg-blue-500" },
  AT_RISK: { label: "At risk", dot: "bg-red-500" },
  ON_HOLD: { label: "On hold", dot: "bg-amber-500" },
  COMPLETED: { label: "Completed", dot: "bg-emerald-500" },
}

// Same hash the sidebar uses, so a project keeps its colour everywhere.
const DOT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-cyan-500",
]

function dotColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return DOT_COLORS[hash % DOT_COLORS.length]
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/* ── Small pieces ───────────────────────────────────────────── */

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border/80 bg-card shadow-xs", className)}>
      {children}
    </section>
  )
}

function CardHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-4 pt-3 pb-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

function PriorityMark({ priority }: { priority: HomeTask["priority"] }) {
  if (priority === "URGENT") {
    return <AlertCircle className="size-3.5 shrink-0 text-red-600" aria-label="Urgent" />
  }
  const Icon = priority === "HIGH" ? SignalHigh : priority === "MEDIUM" ? SignalMedium : SignalLow
  return (
    <Icon
      className={cn("size-3.5 shrink-0", priority === "LOW" ? "text-muted-foreground/60" : "text-foreground/70")}
      aria-label={`${priority.toLowerCase()} priority`}
    />
  )
}

function StatusIcon({ status }: { status: HomeTask["status"] }) {
  if (status === "DONE") return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
  if (status === "IN_PROGRESS") return <LoaderCircle className="size-4 shrink-0 text-amber-500" />
  if (status === "IN_REVIEW") return <Clock className="size-4 shrink-0 text-blue-500" />
  return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />
}

function StatTile({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  caption: string
  tone?: "danger"
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("text-2xl font-semibold tabular-nums", tone === "danger" && value > 0 && "text-red-600")}>
        {value}
      </div>
      <div className={cn("text-[13px] text-muted-foreground", tone === "danger" && value > 0 && "text-red-600")}>
        {caption}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */

export function HomeView({ data, firstName }: { data: HomeData; firstName: string }) {
  const router = useRouter()
  const slug = useParams().slug as string
  const base = `/${slug}`

  const [tab, setTab] = React.useState<TaskTab>("upcoming")
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [projectOpen, setProjectOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)

  const { stats, myTasks, deadlines, projects, activity } = data
  const tasks = myTasks[tab].items
  const hasDeadlines = deadlines.some((d) => d.count > 0)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <>
    <SectionHeader icon={Home} title="Home">
      <SearchCommand variant="header" />
      <ThemeToggle />
    </SectionHeader>
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-5 pb-12">
      {/* Greeting + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" suppressHydrationWarning>
            {today} · Here&apos;s what&apos;s happening across your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-3.5" />
            Invite member
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={() => setProjectOpen(true)}>
            <FolderKanban className="size-3.5" />
            New project
          </Button>
          <Button size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={() => setTaskOpen(true)}>
            <Plus className="size-3.5" />
            New task
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <Card className="grid grid-cols-2 divide-border/80 lg:grid-cols-4 lg:divide-x">
        <StatTile
          icon={FolderKanban}
          label="Active projects"
          value={stats.activeProjects}
          caption={`${stats.atRisk} at risk`}
        />
        <StatTile
          icon={CircleDashed}
          label="Open tasks"
          value={stats.openTasks}
          caption={`${stats.assignedToYou} assigned to you`}
        />
        <StatTile icon={CheckCircle2} label="Completed" value={stats.completedThisWeek} caption="this week" />
        <StatTile icon={Clock} label="Overdue" value={stats.overdue} caption="need attention" tone="danger" />
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="My tasks">
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-muted p-0.5">
                  {TABS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTab(t.value)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors",
                        tab === t.value
                          ? "bg-card font-medium text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.label}
                      <span className="text-muted-foreground">{myTasks[t.value].count}</span>
                    </button>
                  ))}
                </div>
                <Link
                  href={`${base}/my-work`}
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all
                </Link>
              </div>
            </CardHeader>

            {tasks.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                {tab === "upcoming" && "Nothing on your plate. Enjoy it."}
                {tab === "overdue" && "No overdue tasks."}
                {tab === "completed" && "Nothing completed in the last 7 days."}
              </p>
            ) : (
              <ul className="border-t border-border/70">
                {tasks.map((task) => (
                  <li key={task.id} className="border-b border-border/70 last:border-b-0">
                    <Link
                      href={task.project ? `${base}/projects/${task.project.id}/tasks` : `${base}/my-work`}
                      className="flex h-12 items-center gap-3 px-4 transition-colors hover:bg-muted/40"
                    >
                      <StatusIcon status={task.status} />
                      <span className={cn("min-w-0 flex-1 truncate text-sm", task.status === "DONE" && "text-muted-foreground line-through")}>
                        {task.title}
                      </span>
                      {task.project && (
                        <span className="hidden shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground sm:flex">
                          <span className={cn("size-2 rounded-full", dotColor(task.project.id))} />
                          {task.project.name}
                        </span>
                      )}
                      <PriorityMark priority={task.priority} />
                      <span
                        className={cn(
                          "w-16 shrink-0 text-right text-[13px] text-muted-foreground",
                          tab === "overdue" && "text-red-600"
                        )}
                        suppressHydrationWarning
                      >
                        {task.dueDate ? formatDueDate(task.dueDate) : "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Project progress">
              <Link href={`${base}/projects`} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                All projects
              </Link>
            </CardHeader>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <p className="text-[13px] text-muted-foreground">No projects yet.</p>
                <Button size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={() => setProjectOpen(true)}>
                  <Plus className="size-3.5" />
                  New project
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-t border-border/70 text-left text-[13px] font-normal text-muted-foreground">
                      <th className="px-4 py-2.5 font-normal">Project</th>
                      <th className="px-2 py-2.5 font-normal">Status</th>
                      <th className="px-2 py-2.5 font-normal">Progress</th>
                      <th className="px-2 py-2.5 font-normal">Next due</th>
                      <th className="px-4 py-2.5 text-right font-normal">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const state = PROJECT_STATE[p.state]
                      return (
                        <tr key={p.id} className="border-t border-border/70 transition-colors hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            <Link href={`${base}/projects/${p.id}/overview`} className="flex items-center gap-2.5">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm">
                                {p.icon}
                              </span>
                              <span className="truncate font-medium">{p.name}</span>
                            </Link>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-0.5 text-[13px]">
                              <span className={cn("size-1.5 rounded-full", state.dot)} />
                              {state.label}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn("h-full rounded-full", p.state === "AT_RISK" ? "bg-red-500" : "bg-primary")}
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                              <span className="w-9 text-[13px] tabular-nums text-muted-foreground">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-[13px] text-muted-foreground" suppressHydrationWarning>
                            {p.nextDue ? formatDueDate(p.nextDue) : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end -space-x-1.5">
                              {p.members.map((m) => (
                                <PersonAvatar key={m.id} name={m.name} image={m.image} className="size-6" />
                              ))}
                              {p.extraMembers > 0 && (
                                <span className="z-10 flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                                  +{p.extraMembers}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Upcoming deadlines">
              <Link
                href={`${base}/my-work`}
                className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <CalendarDays className="size-3.5" />
                My tasks
              </Link>
            </CardHeader>

            {!hasDeadlines ? (
              <p className="px-4 pt-2 pb-8 text-center text-[13px] text-muted-foreground">
                Nothing due in the next 7 days.
              </p>
            ) : (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {deadlines
                  .filter((d) => d.count > 0)
                  .map((group) => (
                    <div key={group.key}>
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
                        {group.label}
                        <span className="font-normal text-muted-foreground">{group.count}</span>
                      </div>
                      <ul>
                        {group.items.map((task) => (
                          <li key={task.id}>
                            <Link
                              href={task.project ? `${base}/projects/${task.project.id}/tasks` : `${base}/my-work`}
                              className="flex h-8 items-center gap-2.5 text-sm transition-colors hover:text-foreground"
                            >
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  task.project ? dotColor(task.project.id) : "bg-muted-foreground/40"
                                )}
                              />
                              <span className="min-w-0 flex-1 truncate">{task.title}</span>
                              <PriorityMark priority={task.priority} />
                              {task.assignee ? (
                                <PersonAvatar name={task.assignee.name} image={task.assignee.image} className="size-5" />
                              ) : (
                                <span className="size-5 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {group.count > group.items.length && (
                        <p className="pt-1 pl-4.5 text-[13px] text-muted-foreground">
                          +{group.count - group.items.length} more
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent activity">
              <Link
                href={`${base}/inbox`}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
              </Link>
            </CardHeader>

            {activity.length === 0 ? (
              <p className="px-4 pt-2 pb-8 text-center text-[13px] text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-4 px-4 pt-2 pb-4">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <PersonAvatar name={item.user.name} image={item.user.image} className="mt-0.5 size-6 shrink-0" />
                    <p className="min-w-0 flex-1 text-[13px] leading-5 text-muted-foreground">
                      <span className="font-medium text-foreground">{item.user.name}</span> {item.description}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
                      {formatUpdatedDate(item.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        mode="create"
        onSuccess={() => router.refresh()}
      />
      <ProjectDialog
        open={projectOpen}
        onOpenChange={setProjectOpen}
        mode="create"
        onSuccess={() => router.refresh()}
      />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
    </>
  )
}
