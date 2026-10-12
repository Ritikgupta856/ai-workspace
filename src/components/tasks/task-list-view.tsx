"use client"

import * as React from "react"
import { isBefore, isToday, startOfToday } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowUpDown,
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarX2,
  ChevronDown,
  CircleCheck,
  Filter,
  Layers,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Search,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sun,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { SectionHeader } from "@/components/dashboard/section-header"
import { TableSkeleton } from "@/components/dashboard/loading-states"
import { ThemeToggle } from "@/components/common/theme-menu"
import { ToolbarSelect } from "@/components/common/toolbar-select"
import { SearchCommand } from "@/components/layout/search-command"
import { TaskCardMenu } from "@/components/tasks/task-card-menu"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { PersonAvatar, taskKey } from "@/components/tasks/task-grouped-list"
import { TasksCalendar } from "@/components/tasks/tasks-calendar"
import { TaskCard, boardColumns, type Task, type TaskPriority, type TaskStatus } from "@/components/tasks/tasks-view"
import { Kanban } from "@/components/ui/kanban"
import { Button } from "@/components/ui/button"
import { createTask, deleteTask, updateTask } from "@/lib/api/tasks"
import { TASK_STATUS_CONFIG } from "@/lib/constants"
import { formatDueDate } from "@/lib/date"
import { queryKeys } from "@/lib/query/keys"
import { prefetchTaskPanel, useTaskList } from "@/lib/query/tasks"
import { cn } from "@/lib/utils"

type ViewMode = "list" | "kanban" | "calendar"
type SortBy = "dueDate" | "priority" | "updatedAt"
type PriorityFilter = "all" | TaskPriority

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "updatedAt", label: "Last updated" },
]

const FILTER_OPTIONS: { value: PriorityFilter; label: string; pill: string }[] = [
  { value: "all", label: "Any priority", pill: "All" },
  { value: "URGENT", label: "Urgent", pill: "Urgent" },
  { value: "HIGH", label: "High", pill: "High" },
  { value: "MEDIUM", label: "Medium", pill: "Medium" },
  { value: "LOW", label: "Low", pill: "Low" },
]

const PRIORITY_RANK: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Same status colours as the rest of the app, as bare icons rather than badges.
const STATUS_ICON_CLASS: Record<Task["status"], string> = {
  TODO: "text-muted-foreground",
  IN_PROGRESS: "text-amber-500",
  IN_REVIEW: "text-violet-500",
  DONE: "text-emerald-500",
}

// Wide enough for the full row at lg; below that only title, priority and date remain.
const ROW_GRID = cn(
  "grid items-center gap-x-4 px-3",
  "grid-cols-[minmax(0,1fr)_110px_44px]",
  "md:grid-cols-[minmax(0,1fr)_120px_130px_44px]",
  "lg:grid-cols-[minmax(0,1fr)_190px_130px_120px_130px_44px]"
)

type GroupKey = "overdue" | "today" | "upcoming" | "nodate" | "completed"

const GROUPS: { key: GroupKey; label: string; icon: LucideIcon; iconClass: string }[] = [
  { key: "overdue", label: "Overdue", icon: TriangleAlert, iconClass: "text-red-600" },
  { key: "today", label: "Today", icon: Sun, iconClass: "text-foreground" },
  { key: "upcoming", label: "Upcoming", icon: CalendarClock, iconClass: "text-foreground" },
  { key: "nodate", label: "No date", icon: CalendarX2, iconClass: "text-muted-foreground" },
  { key: "completed", label: "Completed", icon: CircleCheck, iconClass: "text-emerald-500" },
]

function groupOf(task: Task): GroupKey {
  if (task.status === "DONE") return "completed"
  if (!task.dueDate) return "nodate"
  const due = new Date(task.dueDate)
  if (isToday(due)) return "today"
  return isBefore(due, startOfToday()) ? "overdue" : "upcoming"
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

function PriorityCell({ priority }: { priority: TaskPriority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase()
  if (priority === "URGENT") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px]">
        <AlertCircle className="size-3.5 text-red-600" />
        {label}
      </span>
    )
  }
  const Icon = priority === "HIGH" ? SignalHigh : priority === "MEDIUM" ? SignalMedium : SignalLow
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <Icon className={cn("size-3.5", priority === "LOW" ? "text-muted-foreground/60" : "text-foreground/70")} />
      {label}
    </span>
  )
}

/* ── Row ────────────────────────────────────────────────────── */

function TaskRow({
  task,
  overdue,
  personal,
  onOpen,
  onToggleDone,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  task: Task
  overdue: boolean
  personal: boolean
  onOpen: (task: Task) => void
  onToggleDone: (task: Task) => void
  onEdit: (task: Task) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const done = task.status === "DONE"
  const status = TASK_STATUS_CONFIG[task.status]
  const StatusIcon = status.icon

  return (
    <div
      role="button"
      tabIndex={0}
      data-task-id={task.id}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(task)
        }
      }}
      className={cn(ROW_GRID, "group h-12 cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/40")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          onClick={(e) => {
            e.stopPropagation()
            onToggleDone(task)
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/40 hover:border-foreground/60"
          )}
        >
          {done && <CircleCheck className="size-3.5" />}
        </button>
        <span className="hidden w-18 shrink-0 font-mono text-xs tracking-wide text-muted-foreground sm:inline">
          {taskKey(task)}
        </span>
        <span className={cn("truncate text-sm", done && "text-muted-foreground line-through")}>{task.title}</span>
        {task.subtaskCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Layers className="size-3" />
            {task.subtaskCount}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3" />
            {task.commentCount}
          </span>
        )}
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-[13px] lg:flex">
        {personal ? (
          task.project && task.projectId ? (
            <>
              <span className={cn("size-2 shrink-0 rounded-full", dotColor(task.projectId))} />
              <span className="truncate">{task.project}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No project</span>
          )
        ) : task.assigneeId ? (
          <>
            <PersonAvatar name={task.assignee} image={task.assigneeImage} className="size-5.5 shrink-0" />
            <span className="truncate">{task.assignee}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </div>

      <div className="hidden items-center gap-1.5 text-[13px] lg:flex">
        <StatusIcon className={cn("size-4", STATUS_ICON_CLASS[task.status])} />
        {status.label}
      </div>

      <div className="hidden md:block lg:block">
        <PriorityCell priority={task.priority} />
      </div>

      <div className={cn("flex items-center gap-1.5 text-[13px]", overdue && "text-red-600")}>
        <CalendarIcon className={cn("size-3.5", !overdue && "text-muted-foreground")} />
        <span className={cn(!task.dueDate && "text-muted-foreground")} suppressHydrationWarning>
          {task.dueDate ? formatDueDate(task.dueDate) : "—"}
        </span>
      </div>

      <span
        className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <TaskCardMenu
          taskId={task.id}
          onView={() => onOpen(task)}
          onEdit={() => onEdit(task)}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </span>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */

export interface TaskListViewProps {
  /** Scopes the list to one project; without it the list is the signed-in user's own tasks. */
  projectId?: string
  title?: string
  /** Replaces the default top bar, e.g. a project breadcrumb. Search and theme are appended. */
  breadcrumb?: React.ReactNode
}

export function TaskListView({ projectId, title = "My Tasks", breadcrumb }: TaskListViewProps) {
  const personal = !projectId
  const client = useQueryClient()
  const { tasks: taskList, loading, error, refetch, setTasks: setTaskList } = useTaskList({ assignedToMe: personal, projectId })

  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [search, setSearch] = React.useState("")
  const [sortBy, setSortBy] = React.useState<SortBy>("dueDate")
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all")
  const [showCompleted, setShowCompleted] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState<Set<GroupKey>>(new Set())

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined)
  const [openTask, setOpenTask] = React.useState<Task | null>(null)

  // Start loading a task's panel once the pointer settles on it, so the click
  // usually opens onto data that has already arrived.
  const hoverTimer = React.useRef<number | undefined>(undefined)
  const handleHover = React.useCallback(
    (event: React.PointerEvent) => {
      const id = (event.target as HTMLElement).closest<HTMLElement>("[data-task-id]")?.dataset.taskId
      window.clearTimeout(hoverTimer.current)
      if (id) hoverTimer.current = window.setTimeout(() => prefetchTaskPanel(client, id), 120)
    },
    [client]
  )
  React.useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const invalidateTasks = React.useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    [client]
  )

  // ?task=<id> opens the detail sheet, so notification and favourite links keep working.
  React.useEffect(() => {
    if (loading) return
    const params = new URLSearchParams(window.location.search)
    const taskId = params.get("task")
    if (!taskId) return
    const match = taskList.find((t) => t.id === taskId)
    if (match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep link, same as TasksView
      setOpenTask(match)
      params.delete("task")
      const rest = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""))
    }
  }, [loading, taskList])

  const summary = React.useMemo(() => {
    const counts = { today: 0, overdue: 0, upcoming: 0 }
    for (const t of taskList) {
      const g = groupOf(t)
      if (g === "today" || g === "overdue" || g === "upcoming") counts[g]++
    }
    return counts
  }, [taskList])

  // Search, priority and sort apply everywhere; hiding completed is a list-only
  // choice, since the board needs its Done column to drop cards into.
  const filtered = React.useMemo(() => {
    let result = taskList
    if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    const list = [...result]
    switch (sortBy) {
      case "priority":
        return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
      case "updatedAt":
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      default:
        return list.sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    }
  }, [taskList, priorityFilter, search, sortBy])

  const visible = React.useMemo(
    () => (showCompleted ? filtered : filtered.filter((t) => t.status !== "DONE")),
    [filtered, showCompleted]
  )

  const grouped = React.useMemo(
    () =>
      GROUPS.map((g) => ({ ...g, tasks: visible.filter((t) => groupOf(t) === g.key) })).filter(
        (g) => g.tasks.length > 0 || (g.key !== "completed" && g.key !== "nodate" && !search.trim() && priorityFilter === "all")
      ),
    [visible, search, priorityFilter]
  )

  function openCreate() {
    setDialogMode("create")
    setEditingTask(undefined)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setDialogMode("edit")
    setEditingTask(task)
    setDialogOpen(true)
  }

  function handleOpen(task: Task) {
    window.clearTimeout(hoverTimer.current)
    setOpenTask(task)
  }

  async function handleToggleDone(task: Task) {
    const next = task.status === "DONE" ? "TODO" : "DONE"
    setTaskList((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      await updateTask(task.id, { status: next })
      invalidateTasks()
    } catch {
      setTaskList((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
    }
  }

  async function handleMove(itemId: string, from: string, to: string) {
    setTaskList((prev) => prev.map((t) => (t.id === itemId ? { ...t, status: to as TaskStatus } : t)))
    try {
      await updateTask(itemId, { status: to as TaskStatus })
      invalidateTasks()
    } catch {
      setTaskList((prev) => prev.map((t) => (t.id === itemId ? { ...t, status: from as TaskStatus } : t)))
    }
  }

  async function handleDelete(id: string) {
    setTaskList((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      await refetch()
    }
  }

  async function handleDuplicate(id: string) {
    const source = taskList.find((t) => t.id === id)
    if (!source) return
    try {
      await createTask({
        title: `${source.title} (copy)`,
        description: source.description,
        projectId: source.projectId ?? projectId,
        status: source.status,
        priority: source.priority,
        labels: source.labels,
        dueDate: source.dueDate,
      })
      invalidateTasks()
    } catch {
      // the list simply doesn't change
    }
  }

  function toggleGroup(key: GroupKey) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const summaryText = [
    summary.today > 0 && `${summary.today} due today`,
    summary.overdue > 0 && `${summary.overdue} overdue`,
    summary.upcoming > 0 && `${summary.upcoming} upcoming`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {breadcrumb ? (
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
          {breadcrumb}
          <div className="flex shrink-0 items-center gap-2.5">
            <SearchCommand variant="header" />
            <ThemeToggle />
          </div>
        </header>
      ) : (
        <SectionHeader icon={CircleCheck} title={title}>
          <SearchCommand variant="header" />
          <ThemeToggle />
        </SectionHeader>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" onPointerOver={handleHover}>
        {/* Title + view switch */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-8 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{summaryText || (personal ? "Nothing assigned to you right now." : "No open tasks in this project.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-muted p-0.5">
              {(
                [
                  { value: "list", label: "List", icon: List },
                  { value: "kanban", label: "Kanban", icon: LayoutGrid },
                  { value: "calendar", label: "Calendar", icon: CalendarIcon },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setViewMode(tab.value)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors",
                    viewMode === tab.value
                      ? "bg-card font-medium text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={openCreate}>
              <Plus className="size-3.5" />
              New task
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-6 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="h-9 w-56 rounded-lg border border-border/80 bg-card pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-64"
            />
          </div>
          <ToolbarSelect
            icon={Filter}
            prefix="Priority"
            value={priorityFilter}
            options={FILTER_OPTIONS}
            onChange={setPriorityFilter}
          />
          <ToolbarSelect icon={ArrowUpDown} prefix="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          <label className="ml-1 flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="size-3.5 accent-primary"
            />
            Show completed
          </label>
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-6 pt-5">
            <TableSkeleton rows={8} label="Loading tasks" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-destructive">{error}</div>
        ) : viewMode === "kanban" ? (
          <div className="flex min-h-0 flex-1 flex-col px-6 pt-5 pb-8">
            <Kanban
              columns={boardColumns}
              items={filtered}
              getItemId={(item) => item.id}
              getColumn={(item) => item.status}
              onMove={handleMove}
              renderCard={(item) => (
                <TaskCard
                  task={item}
                  showAssignee={!personal}
                  onOpen={handleOpen}
                  onEdit={openEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              )}
            />
          </div>
        ) : viewMode === "calendar" ? (
          <div className="px-6 pt-5 pb-8">
            <TasksCalendar tasks={visible} onSelectTask={handleOpen} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
            <CircleCheck className="mb-1 size-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">{search || priorityFilter !== "all" ? "No tasks match" : "No tasks yet"}</p>
            <p className="text-[13px] text-muted-foreground">
              {search || priorityFilter !== "all" ? "Try a different search or filter." : "Tasks assigned to you will show up here."}
            </p>
          </div>
        ) : (
          <div className="px-6 pb-10">
            {/* Column headers */}
            <div className={cn(ROW_GRID, "h-10 border-b border-border/70 text-[13px] text-muted-foreground")}>
              <span className="pl-8">Task</span>
              <span className="hidden lg:block">{personal ? "Project" : "Assignee"}</span>
              <span className="hidden lg:block">Status</span>
              <span className="hidden md:block">Priority</span>
              <span>Due date</span>
              <span />
            </div>

            {grouped.map((group) => {
              const open = !collapsed.has(group.key)
              const Icon = group.icon
              return (
                <section key={group.key}>
                  <div className="flex h-12 items-center gap-2 px-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      aria-label={open ? `Collapse ${group.label}` : `Expand ${group.label}`}
                      aria-expanded={open}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    >
                      <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
                    </button>
                    <Icon className={cn("size-4", group.iconClass)} />
                    <span className="text-sm font-semibold">{group.label}</span>
                    <span className="text-sm text-muted-foreground">{group.tasks.length}</span>
                    <button
                      type="button"
                      onClick={openCreate}
                      aria-label={`Add task to ${group.label}`}
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {open && (
                    <div className="border-t border-border/70">
                      {group.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          overdue={group.key === "overdue"}
                          personal={personal}
                          onOpen={handleOpen}
                          onToggleDone={handleToggleDone}
                          onEdit={openEdit}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={openCreate}
                        className="flex h-10 w-full items-center gap-2 border-b border-border/70 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                        Add task
                      </button>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        task={editingTask}
        projectId={projectId}
        onSuccess={invalidateTasks}
      />

      <TaskDetailSheet
        task={openTask}
        open={openTask !== null}
        onOpenChange={(next) => {
          if (!next) setOpenTask(null)
        }}
        onChanged={(updated) => {
          setTaskList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          setOpenTask(updated)
        }}
        onDeleted={(id) => setTaskList((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  )
}
