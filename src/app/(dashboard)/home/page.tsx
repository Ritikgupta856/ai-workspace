import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  FolderKanban,
  CheckCircle2,
  MessageSquare,
  Database,
  TrendingUp,
  MoreHorizontal,
  GitPullRequest,
  GitBranch,
  CheckCircle,
  RefreshCw,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge"
import { TASK_PRIORITY_CONFIG, INTEGRATION_STATUS_CONFIG } from "@/lib/constants"
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";

const stats = [
  {
    label: "Projects",
    value: "12",
    change: "20%",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    value: "128",
    change: "18%",
    icon: CheckCircle2,
  },
  {
    label: "Chats",
    value: "86",
    change: "24%",
    icon: MessageSquare,
  },
  {
    label: "Documents",
    value: "1,245",
    change: "30%",
    icon: Database,
  },
];

const projects = [
  {
    name: "Synapse",
    description: "The main platform repository",
    icon: "github",
    stat1: 42,
    stat2: 18,
    updated: "Updated 2h ago",
  },
  {
    name: "Synapse Docs",
    description: "Documentation and guides",
    icon: "docs",
    stat1: 23,
    stat2: 8,
    updated: "Updated 5h ago",
  },
  {
    name: "Synapse Web",
    description: "Landing page and marketing site",
    icon: "web",
    stat1: 16,
    stat2: 6,
    updated: "Updated 1d ago",
  },
];

import { TASK_STATUS_CONFIG } from "@/lib/constants"

const columnColorMap: Record<string, { dot: string; bar: string }> = {
  TODO: { dot: "bg-muted-foreground/40", bar: "bg-muted-foreground/40" },
  IN_PROGRESS: { dot: "bg-blue-500", bar: "bg-blue-500" },
  IN_REVIEW: { dot: "bg-blue-300", bar: "bg-blue-300" },
  DONE: { dot: "bg-green-500", bar: "bg-green-500" },
}

const taskColumns = [
  {
    key: "TODO" as const,
    title: "To Do",
    count: 32,
    tasks: [
      { title: "Add GitHub App installation", priority: "Medium" },
      { title: "Improve search ranking", priority: "Low" },
    ],
  },
  {
    key: "IN_PROGRESS" as const,
    title: "In Progress",
    count: 48,
    tasks: [
      { title: "AI chat with document context", priority: "High" },
      { title: "Sync Notion pages", priority: "Medium" },
    ],
  },
  {
    key: "IN_REVIEW" as const,
    title: "In Review",
    count: 21,
    tasks: [
      { title: "PR summary workflow", priority: "Medium" },
      { title: "Task generation from spec", priority: "High" },
    ],
  },
  {
    key: "DONE" as const,
    title: "Done",
    count: 27,
    tasks: [
      { title: "Workspace members API", priority: "Low" },
      { title: "Connect GitHub repositories", priority: "Medium" },
    ],
  },
];

const recentActivity = [
  {
    icon: GitPullRequest,
    title: "PR #342 was merged in synapse/synapse",
    subtitle: "by Ritik Verma",
    time: "2h ago",
  },
  {
    icon: CheckCircle,
    title: 'Task "Implement AI search" completed',
    subtitle: "by John Doe",
    time: "3h ago",
  },
  {
    icon: RefreshCw,
    title: "README.md was synced from GitHub",
    subtitle: "synapse/synapse",
    time: "5h ago",
  },
  {
    icon: MessageSquare,
    title: 'New chat "How does auth work?"',
    subtitle: "by Sarah Wilson",
    time: "6h ago",
  },
  {
    icon: GitBranch,
    title: "Branch feat/integrations created",
    subtitle: "in synapse/synapse",
    time: "1d ago",
  },
];

const integrations = [
  { name: "GitHub", detail: "12 repositories" },
  { name: "Notion", detail: "8 pages" },
  { name: "Linear", detail: "Team workspace" },
];

function priorityConfig(priority: string) {
  const key = priority.toUpperCase().replace(" ", "_") as keyof typeof TASK_PRIORITY_CONFIG
  return TASK_PRIORITY_CONFIG[key] ?? TASK_PRIORITY_CONFIG.LOW
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const firstName = session?.user?.name ?? "Workspace";

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <PageHeading
        title="Home"
        description="Overview of your workspace"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold leading-tight">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              <TrendingUp className="size-3.5 text-green-600" />
              <span className="font-medium text-green-600">
                {stat.change}
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: left (projects + tasks) / right (activity + integrations + usage) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Projects */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Projects</h2>
              <Link
                href="/projects"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <FolderKanban className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                  <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <TrendingUp className="size-3.5" />
                    {project.stat1}
                  </div>
                  <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <CheckCircle2 className="size-3.5" />
                    {project.stat2}
                  </div>
                  <div className="hidden text-xs text-muted-foreground md:block">
                    {project.updated}
                  </div>
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Task overview */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Task Overview</h2>
              <Link
                href="/tasks"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all tasks
              </Link>
            </div>

            {/* Summary bars */}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {taskColumns.map((col) => (
                <div key={col.title}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {col.title}
                  </p>
                  <p className="text-lg font-semibold">{col.count}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${columnColorMap[col.key].bar}`}
                      style={{
                        width: `${(col.count / 128) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Kanban-ish columns */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {taskColumns.map((col) => (
                <div key={col.title} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${columnColorMap[col.key].dot}`}
                      />
                      <p className="text-xs font-medium">{col.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {col.count}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {col.tasks.map((task) => (
                      <div
                        key={task.title}
                        className="rounded-lg border bg-background p-2.5"
                      >
                        <p className="text-xs font-medium leading-snug">
                          {task.title}
                        </p>
                        <StatusBadge
                          className={`mt-2 ${priorityConfig(task.priority).className}`}
                          label={priorityConfig(task.priority).label}
                          icon={priorityConfig(task.priority).icon}
                        />
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                    + Add task
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Recent activity */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Activity</h2>
              <Link
                href="/activity"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                    <item.icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Integrations</h2>
              <Link
                href="/integrations"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center gap-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Database className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.detail}
                    </p>
                  </div>
                  <StatusBadge
                    label={INTEGRATION_STATUS_CONFIG.CONNECTED.label}
                    className={INTEGRATION_STATUS_CONFIG.CONNECTED.className}
                    icon={INTEGRATION_STATUS_CONFIG.CONNECTED.icon}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Usage */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">AI Usage</h2>
              <Link
                href="/settings/usage"
                className="text-sm font-medium text-primary hover:underline"
              >
                View details
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">This Month</p>
            <p className="mt-1 text-sm font-medium">
              82% of 500K tokens used
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[82%] rounded-full bg-blue-500" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Resets in 12 days</span>
              <span>412K / 500K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}