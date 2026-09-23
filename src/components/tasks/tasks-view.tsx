"use client"

import * as React from "react"
import {
  List,
  LayoutGrid,
  Calendar,
  LayoutDashboard,
  ArrowUpDown,
  SlidersHorizontal,
  Filter,
} from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToolbarSearch } from "@/components/common/toolbar-search"
import { ToolbarSelect, toolbarPillClass } from "@/components/common/toolbar-select"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/common/status-badge"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import type { ColumnDef } from "@tanstack/react-table"
import { Kanban, type KanbanColumn } from "@/components/ui/kanban"
import { cn } from "@/lib/utils"
import { NewTaskButton } from "@/components/tasks/new-task-button"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import { TasksCalendar } from "@/components/tasks/tasks-calendar"
import { TaskCardMenu } from "@/components/tasks/task-card-menu"
import {
  TaskGroupedList,
  groupByStatus,
  groupByPriority,
  groupAll,
  type TaskGroup,
} from "@/components/tasks/task-grouped-list"
import { fetchTasks, fetchMyTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks"
import { formatUpdatedDate, formatDueDate } from "@/lib/date"
import { BoardSkeleton, TableSkeleton } from "@/components/dashboard/loading-states"

export type TaskStatus = keyof typeof TASK_STATUS_CONFIG
export type TaskPriority = keyof typeof TASK_PRIORITY_CONFIG

export type Task = {
  id: string
  title: string
  description: string
  project: string | null
  projectId: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  assigneeId: string | null
  assigneeImage?: string | null
  commentCount: number
  subtaskCount: number
  labels: string[]
  dueDate: string | null
  updatedAt: string
  parentTaskId: string | null
}

const boardColumns: KanbanColumn[] = [
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
]

type TaskFilter = "all" | "my"
type GroupBy = "status" | "priority" | "none"
type SortBy = "dueDate" | "updatedAt" | "priority"
type ViewMode = "list" | "kanban" | "calendar"

// The pill reads "Filter by Assignee" until a filter is active, then "Filter by Me".
const taskFilterOptions: { value: TaskFilter; label: string; pill: string }[] = [
  { value: "all", label: "Anyone", pill: "Assignee" },
  { value: "my", label: "Assigned to me", pill: "Me" },
]

const groupByOptions: { value: GroupBy; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "none", label: "None" },
]

const sortByOptions: { value: SortBy; label: string }[] = [
  { value: "dueDate", label: "Due date" },
  { value: "updatedAt", label: "Last updated" },
  { value: "priority", label: "Priority" },
]

const PRIORITY_RANK: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const viewTabs: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: "list", label: "List", icon: List },
  { value: "kanban", label: "Kanban", icon: LayoutGrid },
  { value: "calendar", label: "Calendar", icon: Calendar },
]

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "title",
    header: "Task",
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onOpen?: (task: Task) => void } | undefined
      return (
        <button
          type="button"
          onClick={() => meta?.onOpen?.(row.original)}
          className="text-left font-medium text-foreground transition-colors hover:text-primary"
        >
          {row.original.title}
        </button>
      )
    },
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => (
      <span className={!row.original.project ? "text-muted-foreground" : ""}>
        {row.original.project || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const config = TASK_STATUS_CONFIG[row.original.status]
      return (
        <StatusBadge
          label={config.label}
          className={config.className}
          icon={config.icon}
        />
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const config = TASK_PRIORITY_CONFIG[row.original.priority]
      return (
        <StatusBadge
          label={config.label}
          className={config.className}
          icon={config.icon}
        />
      )
    },
  },
  {
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => (
      <span className={!row.original.assignee || row.original.assignee === "Unassigned" ? "text-muted-foreground" : ""}>
        {row.original.assignee && row.original.assignee !== "Unassigned" ? row.original.assignee : "Unassigned"}
      </span>
    ),
  },
  {
    accessorKey: "labels",
    header: "Labels",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.labels.length > 0 ? (
          row.original.labels.map((label) => (
            <Badge key={label} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => (
      <span className={!row.original.dueDate ? "text-muted-foreground" : ""}>
        {row.original.dueDate ? formatDueDate(row.original.dueDate) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span>{formatUpdatedDate(row.original.updatedAt)}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onDelete?: (id: string) => void
        onDuplicate?: (id: string) => void
        onEdit?: (id: string) => void
        onOpen?: (task: Task) => void
      } | undefined
      return (
        <TaskCardMenu
          taskId={row.original.id}
          onView={() => meta?.onOpen?.(row.original)}
          onEdit={(id) => meta?.onEdit?.(id)}
          onDuplicate={(id) => meta?.onDuplicate?.(id)}
          onMove={(id) => console.log("Move", id)}
          onAddToBacklog={(id) => console.log("Add to backlog", id)}
          onArchive={(id) => console.log("Archive", id)}
          onDelete={(id) => meta?.onDelete?.(id)}
        />
      )
    },
  },
]

function TaskCard({
  task,
  onEdit,
  onOpen,
}: {
  task: Task
  onEdit?: (task: Task) => void
  onOpen?: (task: Task) => void
}) {
  const statusConfig = TASK_STATUS_CONFIG[task.status]
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority]
  const PriorityIcon = priorityConfig.icon

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow">
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(task)}
          className="text-left text-sm font-medium leading-snug text-foreground hover:text-primary"
        >
          {task.title}
        </button>
        <PriorityIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {task.labels.map((label) => (
          <Badge key={label} variant="secondary" className="text-[10px] leading-none">
            {label}
          </Badge>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge
          label={statusConfig.label}
          className={cn(statusConfig.className, "text-[10px] leading-none")}
          icon={statusConfig.icon}
        />
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">{task.assignee}</span>
          <TaskCardMenu
            taskId={task.id}
            onView={() => onOpen?.(task)}
            onEdit={(id) => onEdit?.(task)}
            onDuplicate={(id) => console.log("Duplicate", id)}
            onMove={(id) => console.log("Move", id)}
            onAddToBacklog={(id) => console.log("Add to backlog", id)}
            onArchive={(id) => console.log("Archive", id)}
            onDelete={(id) => console.log("Delete", id)}
          />
        </div>
      </div>
    </div>
  )
}

/** What a custom header slot can drive: mirrors the controls in the toolbar. */
export interface TasksViewControls {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  openCreate: () => void
}

export interface TasksViewProps {
  /** Scopes the whole view (fetch, create, table columns) to one project. */
  projectId?: string
  /** Shows the page-level header (title + New task button). Off inside a project page, which has its own header. */
  showPageHeader?: boolean
  /** Renders a custom header above the toolbar, wired to the view controls. */
  header?: (controls: TasksViewControls) => React.ReactNode
  /** Loads only tasks assigned to the signed-in user (My work) and hides the assignee filter. */
  assignedToMe?: boolean
}

export function TasksView({ projectId, showPageHeader = true, header, assignedToMe = false }: TasksViewProps) {
  const [taskFilter, setTaskFilter] = React.useState<TaskFilter>("all")
  const [search, setSearch] = React.useState("")
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [groupBy, setGroupBy] = React.useState<GroupBy>("status")
  const [sortBy, setSortBy] = React.useState<SortBy>("dueDate")
  const [createStatus, setCreateStatus] = React.useState<TaskStatus | undefined>(undefined)
  const [showCompleted, setShowCompleted] = React.useState(true)
  const [showEmptyGroups, setShowEmptyGroups] = React.useState(false)
  const [taskList, setTaskList] = React.useState<Task[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined)
  const [openTask, setOpenTask] = React.useState<Task | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchList = React.useCallback(
    () => (assignedToMe ? fetchMyTasks() : fetchTasks(projectId)),
    [assignedToMe, projectId]
  )

  const loadTasks = React.useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchList()
      .then((tasks) => setTaskList(tasks))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [fetchList])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Deep-link support: ?task=<id> opens the detail sheet directly,
  // so favorites/notifications links keep working without a full page.
  React.useEffect(() => {
    if (loading || typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const taskId = params.get("task")
    if (!taskId) return
    const match = taskList.find((t) => t.id === taskId)
    if (match) {
      setOpenTask(match)
      params.delete("task")
      const rest = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""))
    }
  }, [loading, taskList])

  function handleOpenTask(task: Task) {
    setOpenTask(task)
  }

  const filteredTasks = React.useMemo(() => {
    let result = taskList

    if (taskFilter === "my") {
      result = result.filter((t) => t.assignee === "Ritik Gupta")
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    return result
  }, [taskFilter, taskList, search])

  const sortedTasks = React.useMemo(() => {
    const list = [...filteredTasks]
    switch (sortBy) {
      case "dueDate":
        // Undated tasks float to the top (they read as "Add date"), then ascending.
        return list.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return -1
          if (!b.dueDate) return 1
          return a.dueDate.localeCompare(b.dueDate)
        })
      case "priority":
        return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
      case "updatedAt":
      default:
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
  }, [filteredTasks, sortBy])

  const visibleTasks = React.useMemo(
    () => (showCompleted ? sortedTasks : sortedTasks.filter((t) => t.status !== "DONE")),
    [sortedTasks, showCompleted]
  )

  const groups = React.useMemo<TaskGroup[]>(() => {
    if (groupBy === "status") {
      const all = groupByStatus(visibleTasks, showEmptyGroups)
      return showCompleted ? all : all.filter((g) => g.status !== "DONE")
    }
    if (groupBy === "priority") return groupByPriority(visibleTasks)
    return groupAll(visibleTasks)
  }, [visibleTasks, groupBy, showEmptyGroups, showCompleted])

  async function handleMove(itemId: string, from: string, to: string, index: number) {
    setTaskList((prev) => {
      const updated = prev.filter((t) => t.id !== itemId)
      const moved = prev.find((t) => t.id === itemId)
      if (!moved) return prev

      const toItems = updated.filter((t) => t.status === to)
      const otherItems = updated.filter((t) => t.status !== to)

      toItems.splice(index, 0, { ...moved, status: to as TaskStatus })

      return [...otherItems, ...toItems]
    })

    try {
      await updateTask(itemId, { status: to as TaskStatus })
    } catch (err) {
      setTaskList((prev) =>
        prev.map((t) => (t.id === itemId ? { ...t, status: from as TaskStatus } : t))
      )
    }
  }

  function handleOpenCreate(status?: TaskStatus) {
    setDialogMode("create")
    setEditingTask(undefined)
    setCreateStatus(status)
    setDialogOpen(true)
  }

  function handleOpenEdit(task: Task) {
    setDialogMode("edit")
    setEditingTask(task)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    setTaskList((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch (err) {
      const tasks = await fetchList()
      setTaskList(tasks)
    }
  }

  async function handleDuplicate(id: string) {
    const source = taskList.find((t) => t.id === id)
    if (!source) return

    const optimistic: Task = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} (copy)`,
      updatedAt: new Date().toISOString(),
    }
    setTaskList((prev) => {
      const idx = prev.findIndex((t) => t.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, optimistic)
      return next
    })

    try {
      const created = await createTask({
        title: `${source.title} (copy)`,
        description: source.description,
        projectId: source.projectId ?? projectId,
        status: source.status,
        priority: source.priority,
        labels: source.labels,
        dueDate: source.dueDate,
      })
      setTaskList((prev) =>
        prev.map((t) => (t.id === optimistic.id ? created : t))
      )
    } catch (err) {
      setTaskList((prev) => prev.filter((t) => t.id !== optimistic.id))
    }
  }

  function handleTaskChanged(updated: Task) {
    setTaskList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setOpenTask(updated)
  }

  function handleTaskDeleted(id: string) {
    setTaskList((prev) => prev.filter((t) => t.id !== id))
  }

  const controls: TasksViewControls = {
    viewMode,
    setViewMode,
    openCreate: () => handleOpenCreate(),
  }

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      {header?.(controls)}

      {/* Toolbar: view switcher on the left, group / sort / view / filter / search on the right */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <div className="flex items-center gap-1.5">
          {viewTabs.map((tab) => {
            const Icon = tab.icon
            const active = viewMode === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setViewMode(tab.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors",
                  active
                    ? "border border-border/80 bg-card font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span className={cn(tab.value !== "list" && "hidden sm:inline")}>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!showPageHeader && !header && <NewTaskButton onNewTask={() => handleOpenCreate()} />}

          <ToolbarSelect
            icon={LayoutDashboard}
            prefix="Group by"
            value={groupBy}
            options={groupByOptions}
            onChange={setGroupBy}
          />
          <ToolbarSelect
            icon={ArrowUpDown}
            prefix="Sort"
            value={sortBy}
            options={sortByOptions}
            onChange={setSortBy}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={toolbarPillClass}>
                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Display
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={showCompleted} onCheckedChange={(v) => setShowCompleted(!!v)}>
                Show completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showEmptyGroups}
                disabled={groupBy !== "status"}
                onCheckedChange={(v) => setShowEmptyGroups(!!v)}
              >
                Show empty groups
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!assignedToMe && (
            <ToolbarSelect
              icon={Filter}
              prefix="Filter by"
              value={taskFilter}
              options={taskFilterOptions}
              onChange={setTaskFilter}
            />
          )}

          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search tasks..." />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-8">
        {loading ? (
          viewMode === "list" ? <TableSkeleton rows={8} /> : <BoardSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-destructive">
            {error}
          </div>
        ) : viewMode === "list" ? (
          <TaskGroupedList
            groups={groups}
            selectedId={openTask?.id}
            sortedByDue={sortBy === "dueDate"}
            onOpen={handleOpenTask}
            onEdit={handleOpenEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onAddToGroup={(status) => handleOpenCreate(status)}
          />
        ) : viewMode === "calendar" ? (
          <TasksCalendar tasks={visibleTasks} onSelectTask={handleOpenTask} />
        ) : (
          <Kanban
            columns={boardColumns}
            items={visibleTasks}
            getItemId={(item) => item.id}
            getColumn={(item) => item.status}
            onMove={handleMove}
            renderCard={(item) => <TaskCard task={item} onEdit={handleOpenEdit} onOpen={handleOpenTask} />}
          />
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        task={editingTask}
        defaultProjectId={projectId}
        defaultStatus={createStatus}
        onSuccess={() => {
          loadTasks()
        }}
      />

      <TaskDetailSheet
        task={openTask}
        open={openTask !== null}
        onOpenChange={(next) => { if (!next) setOpenTask(null) }}
        onChanged={handleTaskChanged}
        onDeleted={handleTaskDeleted}
      />
    </div>
  )

  if (!showPageHeader) return body

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Tasks" action={<NewTaskButton onNewTask={() => handleOpenCreate()} />} />
      {body}
    </div>
  )
}
