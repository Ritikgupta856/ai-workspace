"use client"

import * as React from "react"
import { nanoid } from "nanoid"
import Link from "next/link"
import { LayoutList, Columns3, CalendarDays } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { PageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/common/status-badge"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import type { ColumnDef } from "@tanstack/react-table"
import { Kanban, type KanbanColumn } from "@/components/ui/kanban"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { NewTaskButton } from "@/components/tasks/new-task-button"
import { TaskDialog } from "@/components/tasks/task-dialog"
import { TasksCalendar } from "@/components/tasks/tasks-calendar"
import { TaskCardMenu } from "@/components/tasks/task-card-menu"
import { fetchTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks"
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
  labels: string[]
  dueDate: string | null
  updatedAt: string
}

const boardColumns: KanbanColumn[] = [
  { id: "TODO", title: "Todo" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
]

type TaskFilter = "all" | "my"

const taskFilterOptions: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All Tasks" },
  { value: "my", label: "My Tasks" },
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
    cell: ({ row }) => (
      <Link
        href={`/tasks/${row.original.id}`}
        className="font-medium text-foreground transition-colors hover:text-primary"
      >
        {row.original.title}
      </Link>
    ),
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
      } | undefined
      return (
        <TaskCardMenu
          taskId={row.original.id}
          onView={(id) => { window.location.href = `/tasks/${id}` }}
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
}: {
  task: Task
  onEdit?: (task: Task) => void
}) {
  const statusConfig = TASK_STATUS_CONFIG[task.status]
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority]
  const PriorityIcon = priorityConfig.icon

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </span>
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
            onView={(id) => { window.location.href = `/tasks/${id}` }}
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

export interface TasksViewProps {
  /** Scopes the whole view (fetch, create, table columns) to one project. */
  projectId?: string
  /** Shows the page-level header (title + New task button). Off inside a project page, which has its own header. */
  showPageHeader?: boolean
}

export function TasksView({ projectId, showPageHeader = true }: TasksViewProps) {
  const [taskFilter, setTaskFilter] = React.useState<TaskFilter>("all")
  const [search, setSearch] = React.useState("")
  const [viewMode, setViewMode] = React.useState("table")
  const [taskList, setTaskList] = React.useState<Task[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadTasks = React.useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchTasks(projectId)
      .then((tasks) => setTaskList(tasks))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

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

  const visibleColumns = React.useMemo(
    () =>
      projectId
        ? columns.filter((c) => !("accessorKey" in c) || c.accessorKey !== "project")
        : columns,
    [projectId]
  )

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

  function handleOpenCreate() {
    setDialogMode("create")
    setEditingTask(undefined)
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
      const tasks = await fetchTasks(projectId)
      setTaskList(tasks)
    }
  }

  async function handleDuplicate(id: string) {
    const source = taskList.find((t) => t.id === id)
    if (!source) return

    const optimistic: Task = {
      ...source,
      id: nanoid(),
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

  const tableMeta = React.useMemo(
    () => ({
      onDelete: handleDelete,
      onDuplicate: handleDuplicate,
      onEdit: (id: string) => {
        const task = taskList.find((t) => t.id === id)
        if (task) handleOpenEdit(task)
      },
    }),
    [taskList]
  )

  const body = (
    <div className={showPageHeader ? "flex flex-1 flex-col gap-6 p-6" : "flex flex-1 flex-col gap-4"}>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search tasks..."
          compact
          className="max-w-sm"
        />

        <div className="ml-auto flex items-center gap-3">
          {!showPageHeader && <NewTaskButton onNewTask={handleOpenCreate} />}

          <Select value={taskFilter} onValueChange={(v) => setTaskFilter(v as TaskFilter)}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {taskFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="table" className="px-3" aria-label="Table view">
                <LayoutList className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="board" className="px-3" aria-label="Board view">
                <Columns3 className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-3" aria-label="Calendar view">
                <CalendarDays className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        viewMode === "table" ? <TableSkeleton rows={8} /> : <BoardSkeleton />
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-destructive">
          {error}
        </div>
      ) : viewMode === "table" ? (
        <DataTable columns={visibleColumns} data={filteredTasks} meta={tableMeta} />
      ) : viewMode === "calendar" ? (
        <TasksCalendar tasks={filteredTasks} onSelectTask={handleOpenEdit} />
      ) : (
        <Kanban
          columns={boardColumns}
          items={filteredTasks}
          getItemId={(item) => item.id}
          getColumn={(item) => item.status}
          onMove={handleMove}
          renderCard={(item) => <TaskCard task={item} onEdit={handleOpenEdit} />}
        />
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        task={editingTask}
        defaultProjectId={projectId}
        onSuccess={() => {
          loadTasks()
        }}
      />
    </div>
  )

  if (!showPageHeader) return body

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Tasks" action={<NewTaskButton onNewTask={handleOpenCreate} />} />
      {body}
    </div>
  )
}
