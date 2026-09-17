"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  CircleDashed,
  Sun,
  Loader,
  CircleCheck,
  Calendar,
  List,
  Layers,
  MessageSquare,
  MoreHorizontal,
  CirclePlus,
  Settings2,
  ArrowDown,
  UserRoundPlus,
  Plus,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskCardMenu } from "@/components/tasks/task-card-menu"
import { cn } from "@/lib/utils"
import { TASK_PRIORITY_PILL } from "@/lib/constants"
import type { Task, TaskStatus, TaskPriority } from "@/components/tasks/tasks-view"

/* ── Config ─────────────────────────────────────────────────── */

// Tinted section bands per status — matches the reference's Backlog /
// In Progress / In Review / Completed headers rather than the badge palette.
const GROUP_CONFIG: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; band: string; iconClass: string }
> = {
  TODO: {
    label: "Backlog",
    icon: CircleDashed,
    band: "bg-muted/60 dark:bg-muted/40",
    iconClass: "text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Sun,
    band: "bg-orange-50 dark:bg-orange-950/25",
    iconClass: "text-orange-500 [&>circle]:fill-orange-500",
  },
  IN_REVIEW: {
    label: "In Review",
    icon: Loader,
    band: "bg-pink-50 dark:bg-pink-950/25",
    iconClass: "text-pink-500",
  },
  DONE: {
    label: "Completed",
    icon: CircleCheck,
    band: "bg-emerald-50 dark:bg-emerald-950/25",
    iconClass: "text-emerald-500 [&>circle]:fill-emerald-500 [&>path]:stroke-white",
  },
}

const PRIORITY_PILL = TASK_PRIORITY_PILL

export const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]
const PRIORITY_ORDER: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"]

/* ── Helpers ────────────────────────────────────────────────── */

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  return hash
}

// Tasks have cuid ids; derive a short human key like "LM-204" from the
// project name and a stable hash of the id so it never changes between loads.
export function taskKey(task: Task): string {
  const words = (task.project ?? "Task").split(/\s+/).filter(Boolean)
  const prefix =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : words[0].slice(0, 2).toUpperCase()
  return `${prefix}-${100 + (hashString(task.id) % 900)}`
}

// Deterministic gradient per person so the same assignee always gets the same colors.
const AVATAR_GRADIENTS = [
  "from-violet-500 via-fuchsia-500 to-orange-400",
  "from-sky-500 via-cyan-400 to-emerald-400",
  "from-pink-500 via-rose-400 to-amber-300",
  "from-indigo-500 via-blue-500 to-cyan-400",
  "from-emerald-500 via-lime-400 to-yellow-300",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/* ── Cells ──────────────────────────────────────────────────── */

function AssigneeAvatar({ task }: { task: Task }) {
  const unassigned = !task.assigneeId || task.assignee === "Unassigned"
  if (unassigned) {
    return (
      <span
        className="flex size-5.5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground"
        title="Unassigned"
      >
        <UserRoundPlus className="size-2.5" />
      </span>
    )
  }
  return (
    <Avatar className="size-5.5 ring-2 ring-background" title={task.assignee}>
      {task.assigneeImage ? <AvatarImage src={task.assigneeImage} alt={task.assignee} /> : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br text-[8px] font-semibold text-white",
          AVATAR_GRADIENTS[hashString(task.assignee) % AVATAR_GRADIENTS.length]
        )}
      >
        {initials(task.assignee)}
      </AvatarFallback>
    </Avatar>
  )
}

// Shared column template so the header and every row line up. List and Due
// date collapse below md; Priority and Assignee always stay.
const ROW_GRID = cn(
  "grid items-center px-4",
  "grid-cols-[minmax(0,1fr)_88px_36px]",
  "md:grid-cols-[minmax(0,1fr)_104px_136px_150px_64px]",
  "xl:grid-cols-[minmax(0,1fr)_140px_160px_190px_76px]",
  "2xl:grid-cols-[minmax(0,1fr)_170px_190px_220px_84px]"
)

function Col({
  children,
  sortIcon,
  className,
}: {
  children: React.ReactNode
  sortIcon?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-muted-foreground", className)}>
      {children}
      {sortIcon ? (
        <ArrowDown className="size-3 rounded-full border border-muted-foreground/40 p-px" />
      ) : (
        <Settings2 className="size-3 rounded-full border border-dashed border-muted-foreground/40 p-px" />
      )}
    </span>
  )
}

function ColumnHeader({ sortedByDue }: { sortedByDue: boolean }) {
  return (
    <div className={cn(ROW_GRID, "h-8")}>
      <Col>Name</Col>
      <Col>Priority</Col>
      <Col className="hidden md:inline-flex">List</Col>
      <Col sortIcon={sortedByDue} className="hidden md:inline-flex">
        Due date
      </Col>
      <Col className="justify-end">Assignee</Col>
    </div>
  )
}

interface TaskRowProps {
  task: Task
  selected: boolean
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function TaskRow({ task, selected, onOpen, onEdit, onDuplicate, onDelete }: TaskRowProps) {
  const priority = PRIORITY_PILL[task.priority]
  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={selected || undefined}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(task)
        }
      }}
      className={cn(
        ROW_GRID,
        "group h-11 cursor-pointer rounded-lg border border-transparent transition-colors",
        "hover:border-border hover:bg-muted/40",
        selected && "border-border bg-muted/40"
      )}
    >
      {/* Name: key · title · subtask/comment counts · row menu (hover) */}
      <div className="flex min-w-0 items-center gap-2 pr-3">
        <span className="w-18 shrink-0 font-mono text-xs tracking-wide text-muted-foreground">
          {taskKey(task)}
        </span>
        <span className="truncate text-sm font-medium leading-5 text-foreground">
          {task.title}
        </span>
        {task.subtaskCount > 0 ? (
          <span
            className="ml-0.5 inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            title={`${task.subtaskCount} subtasks`}
          >
            <Layers className="size-3" />
            {task.subtaskCount}
          </span>
        ) : null}
        {task.commentCount > 0 ? (
          <span
            className="ml-0.5 inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
            title={`${task.commentCount} comments`}
          >
            <MessageSquare className="size-3" />
            {task.commentCount}
          </span>
        ) : null}
        <span
          className={cn(
            "ml-0.5 shrink-0 transition-opacity group-hover:opacity-100 [&_button]:size-5.5 [&_button]:rounded-md [&_svg]:size-3.5",
            selected ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <TaskCardMenu
            taskId={task.id}
            onView={() => onOpen(task)}
            onEdit={() => onEdit(task)}
            onDuplicate={onDuplicate}
            onMove={() => {}}
            onAddToBacklog={() => {}}
            onArchive={() => {}}
            onDelete={onDelete}
          />
        </span>
      </div>

      {/* Priority pill */}
      <div>
        <span
          className={cn(
            "inline-flex h-4.5 items-center rounded px-1.5 text-[11px] font-medium leading-none",
            priority.className
          )}
        >
          {priority.label}
        </span>
      </div>

      {/* List (project) */}
      <div className="hidden min-w-0 items-center gap-1.5 text-[13px] text-foreground md:flex">
        <List className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !task.project && "text-muted-foreground")}>
          {task.project ?? "No list"}
        </span>
      </div>

      {/* Due date */}
      <div className="hidden items-center gap-1.5 text-[13px] md:flex">
        {task.dueDate ? (
          <span className="text-foreground">{format(new Date(task.dueDate), "EEE, d MMM yyyy")}</span>
        ) : (
          <>
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Add date</span>
          </>
        )}
      </div>

      {/* Assignee */}
      <div className="flex items-center justify-end">
        <AssigneeAvatar task={task} />
      </div>
    </div>
  )
}

/* ── Grouping ───────────────────────────────────────────────── */

export interface TaskGroup {
  key: string
  status?: TaskStatus
  label: string
  icon: LucideIcon
  band: string
  iconClass: string
  tasks: Task[]
}

/** Status groups in canonical order. Empty ones are kept only when `includeEmpty`. */
export function groupByStatus(tasks: Task[], includeEmpty = false): TaskGroup[] {
  return STATUS_ORDER.map((status) => ({
    key: status,
    status,
    ...GROUP_CONFIG[status],
    tasks: tasks.filter((t) => t.status === status),
  })).filter((g) => includeEmpty || g.tasks.length > 0)
}

/** Priority groups (Urgent → Low), dropping empty ones. */
export function groupByPriority(tasks: Task[]): TaskGroup[] {
  return PRIORITY_ORDER.map((p) => ({
    key: p,
    label: PRIORITY_PILL[p].label,
    icon: CircleDashed,
    band: GROUP_CONFIG.TODO.band,
    iconClass: GROUP_CONFIG.TODO.iconClass,
    tasks: tasks.filter((t) => t.priority === p),
  })).filter((g) => g.tasks.length > 0)
}

/** A single flat group for the "no grouping" mode. */
export function groupAll(tasks: Task[]): TaskGroup[] {
  if (tasks.length === 0) return []
  return [
    {
      key: "all",
      label: "All tasks",
      icon: CircleDashed,
      band: GROUP_CONFIG.TODO.band,
      iconClass: GROUP_CONFIG.TODO.iconClass,
      tasks,
    },
  ]
}

/* ── List ───────────────────────────────────────────────────── */

export interface TaskGroupedListProps {
  groups: TaskGroup[]
  /** Highlights the row whose task is open in the detail sheet. */
  selectedId?: string | null
  sortedByDue?: boolean
  onOpen: (task: Task) => void
  onEdit: (task: Task) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onAddToGroup?: (status?: TaskStatus) => void
}

export function TaskGroupedList({
  groups,
  selectedId,
  sortedByDue = true,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  onAddToGroup,
}: TaskGroupedListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
        <CircleDashed className="mb-1 size-7 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">No tasks yet</p>
        <p className="text-sm text-muted-foreground">Create a task to see it grouped here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const Icon = group.icon
        return (
          <section key={group.key} className="flex flex-col">
            {/* Band */}
            <div className={cn("flex h-10 items-center justify-between rounded-lg px-4", group.band)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("size-3.5", group.iconClass)} />
                <span className="font-mono text-xs font-medium text-foreground">{group.label}</span>
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/80 bg-card px-1 font-mono text-[10px] leading-none text-muted-foreground">
                  {group.tasks.length}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-background/80 hover:text-foreground"
                  aria-label="Group options"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onAddToGroup?.(group.status)}
                  className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-background/80 hover:text-foreground"
                  aria-label={`Add task to ${group.label}`}
                >
                  <CirclePlus className="size-3.5" />
                </button>
              </div>
            </div>

            <ColumnHeader sortedByDue={sortedByDue} />

            <div className="flex flex-col">
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={task.id === selectedId}
                  onOpen={onOpen}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ))}
              {group.tasks.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAddToGroup?.(group.status)}
                  className="flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                  Add task
                </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
