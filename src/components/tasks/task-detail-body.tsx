"use client"

import * as React from "react"

import { toast } from "sonner"
import {
  CalendarDays,
  CalendarIcon,
  ChevronsUpDown,
  CircleDot,
  Clock3,
  CornerLeftUp,
  Flag,
  FolderKanban,
  History,
  Link2,
  ListChecks,
  ListPlus,
  MessageSquare,
  PenLine,
  Plus,
  RefreshCw,
  Send,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { StatusBadge } from "@/components/common/status-badge"
import { LabelMultiSelect } from "@/components/tasks/task-dialog"
import { PersonAvatar, taskKey } from "@/components/tasks/task-grouped-list"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { format, isBefore, startOfToday } from "date-fns"
import {
  fetchTask,
  fetchTasks,
  createTask,
  updateTask,
  type TaskAssignee,
  type TaskComment,
  type TaskDetail,
} from "@/lib/api/tasks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query/keys"
import { useAddTaskComment, useAssignableMembers, useTaskActivity, useTaskComments } from "@/lib/query/tasks"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus, TaskPriority } from "@/components/tasks/tasks-view"

/**
 * The task record, laid out like every other record view: an identity block
 * (status tile, title, key and project, the people involved), quick actions,
 * then icon tabs. Details is a list of icon + label + value rows where every
 * value edits in place.
 *
 * Render this keyed by `task.id` (both call sites do) so switching to a
 * different task remounts fresh local state instead of needing an effect to
 * re-sync it.
 */

const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({ value, ...config }))
const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({ value, ...config }))

type Tab = "details" | "comments" | "subtasks" | "activity"

/** Status tiles: the record's "logo", tinted by where the task is. */
const STATUS_TILE: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  IN_REVIEW: "bg-amber-500/14 text-amber-600 dark:text-amber-400",
  DONE: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
}

/** The trigger look shared by every editable value: quiet until hovered. */
const inlineTrigger =
  "h-8 w-auto -ml-2 gap-1.5 border-none bg-transparent px-2 text-[13px] font-normal shadow-none hover:bg-muted data-[state=open]:bg-muted [&>svg]:opacity-50"

export interface TaskDetailBodyProps {
  task: TaskDetail
  /** Comments already loaded with the task, so the body doesn't fetch them again. */
  initialComments?: TaskComment[]
  /** Assignable people already loaded for the task's current project. */
  initialMembers?: TaskAssignee[]
  onChanged: (task: TaskDetail) => void
}

export function TaskDetailBody({
  task,
  initialComments,
  initialMembers,
  onChanged,
}: TaskDetailBodyProps) {
  const [tab, setTab] = React.useState<Tab>("details")
  const [title, setTitle] = React.useState(task.title)
  const [description, setDescription] = React.useState(task.description)
  const client = useQueryClient()
  const [focusComposer, setFocusComposer] = React.useState(false)
  const [parentPickerOpen, setParentPickerOpen] = React.useState(false)
  const [parentCandidates, setParentCandidates] = React.useState<Task[]>([])
  const [addingSubtask, setAddingSubtask] = React.useState(false)
  const [subtaskTitle, setSubtaskTitle] = React.useState("")

  // Assignable people are scoped to this task's project (the whole workspace
  // for a project-less task). The panel already loaded them for the project
  // it opened on; moving the task to another project is a different cache
  // entry, so it is fetched rather than seeded with the wrong list.
  const [openedOnProject] = React.useState(task.projectId ?? null)
  const projectId = task.projectId ?? null
  const { data: membersList = [] } = useAssignableMembers(
    projectId,
    projectId === openedOnProject ? initialMembers : undefined
  )
  const { data: comments = [] } = useTaskComments(task.id, initialComments)

  const addComment = useAddTaskComment()
  const handleAddComment = (content: string) => addComment.mutate({ taskId: task.id, content })

  async function persist(patch: Parameters<typeof updateTask>[1]) {
    try {
      await updateTask(task.id, patch)
      const fresh = await fetchTask(task.id)
      onChanged(fresh)
      client.invalidateQueries({ queryKey: queryKeys.tasks.activity(task.id) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  function handleTitleBlur() {
    const trimmed = title.trim() || "Untitled"
    if (trimmed !== task.title) persist({ title: trimmed })
  }

  function handleDescriptionBlur() {
    if (description !== task.description) persist({ description })
  }

  async function openParentPicker(open: boolean) {
    setParentPickerOpen(open)
    if (open && parentCandidates.length === 0) {
      const all = await fetchTasks(task.projectId ?? undefined)
      const excluded = new Set([task.id, ...task.subtasks.map((s) => s.id)])
      setParentCandidates(all.filter((t) => !excluded.has(t.id)))
    }
  }

  async function handleAddSubtask() {
    const trimmed = subtaskTitle.trim()
    if (!trimmed) return
    try {
      await createTask({ title: trimmed, projectId: task.projectId ?? undefined, parentTaskId: task.id })
      const fresh = await fetchTask(task.id)
      onChanged(fresh)
      setSubtaskTitle("")
      setAddingSubtask(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add sub-work item")
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?task=${task.id}`)
      toast.success("Link copied")
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  const StatusIcon = TASK_STATUS_CONFIG[task.status].icon
  const statusConfig = TASK_STATUS_CONFIG[task.status]
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority]
  const assigned = Boolean(task.assigneeId) && task.assignee !== "Unassigned"
  const overdue = task.dueDate !== null && task.status !== "DONE" && isBefore(new Date(task.dueDate), startOfToday())

  // Everyone involved, assignee first, then whoever created or discussed it.
  const people = React.useMemo(() => {
    const seen = new Map<string, string | null>()
    if (assigned) seen.set(task.assignee, task.assigneeImage ?? null)
    if (task.createdBy && !seen.has(task.createdBy)) seen.set(task.createdBy, null)
    for (const c of comments) if (!seen.has(c.author.name)) seen.set(c.author.name, c.author.image)
    return [...seen].map(([name, image]) => ({ name, image }))
  }, [assigned, task.assignee, task.assigneeImage, task.createdBy, comments])

  const tabs: { id: Tab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: "details", label: "Details", icon: ListChecks },
    { id: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
    { id: "subtasks", label: "Sub-items", icon: ListPlus, count: task.subtasks.length },
    { id: "activity", label: "Activity", icon: History },
  ]

  const composerRef = React.useRef<HTMLInputElement>(null)

  function startComment() {
    setTab("comments")
    setFocusComposer(true)
  }

  function startSubtask() {
    setTab("subtasks")
    setAddingSubtask(true)
  }

  const identity = (
    <div className="flex items-start gap-4">
      <div
        className={cn("flex size-14 shrink-0 items-center justify-center rounded-2xl", STATUS_TILE[task.status])}
        title={statusConfig.label}
      >
        <StatusIcon className="size-6" />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          rows={1}
          placeholder="Task title"
          className="field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="font-mono text-xs tracking-wide">{taskKey(task)}</span>
          <span aria-hidden>·</span>
          <FolderKanban className="size-3.5 shrink-0" />
          <span className="truncate">{task.project ?? "No project"}</span>
        </div>
      </div>

      {people.length > 0 && (
        <div className="flex shrink-0 items-center -space-x-1.5 pt-1">
          {people.slice(0, 4).map((p) => (
            <PersonAvatar key={p.name} name={p.name} image={p.image} className="size-7" />
          ))}
          {people.length > 4 && (
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
              +{people.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const quickActions = (
    <div className="mt-5 flex flex-wrap gap-2">
      <QuickAction icon={MessageSquare} onClick={startComment}>
        Comment
      </QuickAction>
      <QuickAction icon={ListPlus} onClick={startSubtask}>
        Add sub-item
      </QuickAction>
      <QuickAction icon={Link2} onClick={copyLink}>
        Copy link
      </QuickAction>
    </div>
  )

  const propertyRows = (
    <>
      <PropertyRow icon={CircleDot} label="Status">
        <Select value={task.status} onValueChange={(v) => persist({ status: v as TaskStatus })}>
          <SelectTrigger className={inlineTrigger}>
            <SelectValue>
              <StatusBadge label={statusConfig.label} className={statusConfig.className} icon={statusConfig.icon} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <StatusBadge label={opt.label} className={opt.className} icon={opt.icon} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow icon={Flag} label="Priority">
        <Select value={task.priority} onValueChange={(v) => persist({ priority: v as TaskPriority })}>
          <SelectTrigger className={inlineTrigger}>
            <SelectValue>
              <StatusBadge label={priorityConfig.label} className={priorityConfig.className} icon={priorityConfig.icon} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <StatusBadge label={opt.label} className={opt.className} icon={opt.icon} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow icon={UserRound} label="Assignee">
        <Select
          value={task.assigneeId ?? "unassigned"}
          onValueChange={(v) => persist({ assigneeId: v === "unassigned" ? undefined : v })}
        >
          <SelectTrigger className={inlineTrigger}>
            <SelectValue placeholder="Unassigned">
              {assigned ? (
                <span className="flex items-center gap-2">
                  <PersonAvatar name={task.assignee} image={task.assigneeImage} className="size-5 ring-0" />
                  {task.assignee}
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {membersList.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                <span className="flex items-center gap-2">
                  <PersonAvatar name={m.name} image={m.avatar} className="size-5 ring-0" />
                  {m.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow icon={CalendarDays} label="Due date">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] hover:bg-muted",
                !task.dueDate && "text-muted-foreground",
                overdue && "text-destructive"
              )}
            >
              <CalendarIcon className="size-3.5 opacity-60" />
              {task.dueDate ? formatDueDate(task.dueDate) : "Set due date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={task.dueDate ? new Date(task.dueDate) : undefined}
              onSelect={(date) => persist({ dueDate: date ? format(date, "yyyy-MM-dd") : null })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </PropertyRow>

      <PropertyRow icon={FolderKanban} label="Project">
        <span className={cn(!task.project && "text-muted-foreground")}>{task.project ?? "No project"}</span>
      </PropertyRow>

      <PropertyRow icon={CornerLeftUp} label="Parent">
        <Popover open={parentPickerOpen} onOpenChange={openParentPicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "-ml-2 inline-flex h-8 max-w-full items-center gap-1.5 rounded-md px-2 text-[13px] hover:bg-muted",
                !task.parent && "text-muted-foreground"
              )}
            >
              <span className="truncate">{task.parent ? task.parent.title : "Add parent"}</span>
              <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tasks..." />
              <CommandList>
                <CommandEmpty>No matching tasks.</CommandEmpty>
                <CommandGroup>
                  {task.parent && (
                    <CommandItem
                      onSelect={() => {
                        persist({ parentTaskId: null })
                        setParentPickerOpen(false)
                      }}
                    >
                      <span className="text-muted-foreground">Clear parent</span>
                    </CommandItem>
                  )}
                  {parentCandidates.map((t) => (
                    <CommandItem
                      key={t.id}
                      onSelect={() => {
                        persist({ parentTaskId: t.id })
                        setParentPickerOpen(false)
                      }}
                    >
                      {t.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </PropertyRow>

      <PropertyRow icon={Tag} label="Labels">
        <LabelMultiSelect variant="inline" selected={task.labels} onChange={(labels) => persist({ labels })} />
      </PropertyRow>
    </>
  )

  const recordRows = (
    <>
      <PropertyRow icon={PenLine} label="Created by">
        <span className="flex items-center gap-2">
          <PersonAvatar name={task.createdBy} className="size-5 ring-0" />
          {task.createdBy}
        </span>
      </PropertyRow>
      <PropertyRow icon={Clock3} label="Created">
        {format(new Date(task.createdAt), "MMM d, yyyy")}
      </PropertyRow>
      <PropertyRow icon={RefreshCw} label="Updated">
        {formatUpdatedDate(task.updatedAt)}
      </PropertyRow>
    </>
  )

  const descriptionField = (
    <Textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      onBlur={handleDescriptionBlur}
      placeholder="Add a description..."
      className="mt-2 min-h-28 resize-y border-none bg-transparent px-0 text-[14px] leading-relaxed shadow-none focus-visible:ring-0"
    />
  )

  const subtaskList = (
    <div className="flex flex-col">
      {task.subtasks.length === 0 && !addingSubtask && (
        <p className="px-2 py-3 text-[13px] text-muted-foreground">No sub-items yet.</p>
      )}
      {task.subtasks.map((sub) => {
        const subStatus = TASK_STATUS_CONFIG[sub.status]
        const SubIcon = subStatus.icon
        return (
          <div key={sub.id} className="flex h-11 w-full items-center gap-2.5 rounded-md px-2 text-[13px]">
            <SubIcon className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                sub.status === "DONE" && "text-muted-foreground line-through decoration-muted-foreground/40"
              )}
            >
              {sub.title}
            </span>
            <StatusBadge label={subStatus.label} className={subStatus.className} />
          </div>
        )
      })}

      {addingSubtask ? (
        <div className="px-2 py-1.5">
          <Input
            autoFocus
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubtask()
              if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle("") }
            }}
            onBlur={() => { if (!subtaskTitle.trim()) setAddingSubtask(false) }}
            placeholder="Sub-item title, then Enter"
            className="h-9 text-[13px]"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingSubtask(true)}
          className="flex h-10 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" />
          Add sub-item
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6 pb-5">
        {identity}
        {quickActions}
      </div>

      <div role="tablist" aria-label="Task sections" className="flex items-center gap-1 overflow-x-auto border-y px-4">
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-2 px-2.5 text-[13px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-[11px] leading-4.5 tabular-nums text-muted-foreground">
                  {count}
                </span>
              )}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
            </button>
          )
        })}
      </div>

      {tab === "details" && (
        <div role="tabpanel">
          <dl className="flex flex-col px-6 py-3">
            {propertyRows}
            {recordRows}
          </dl>
          <section className="border-t px-6 pt-5 pb-6">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            {descriptionField}
          </section>
        </div>
      )}

      {tab === "comments" && (
        <div role="tabpanel">
          <CommentsPanel comments={comments} autoFocus={focusComposer} inputRef={composerRef} onAdd={handleAddComment} />
        </div>
      )}

      {tab === "subtasks" && (
        <div role="tabpanel" className="px-4 py-3">
          {subtaskList}
        </div>
      )}

      {tab === "activity" && (
        <div role="tabpanel">
          <ActivityPanel taskId={task.id} />
        </div>
      )}
    </div>
  )
}

/* ── Pieces ─────────────────────────────────────────────────── */

function QuickAction({
  icon: Icon,
  onClick,
  children,
}: {
  icon: LucideIcon
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-normal text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-3.5" />
      {children}
    </Button>
  )
}

function PropertyRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <dt className="flex w-32 shrink-0 items-center gap-2.5 text-[13px] text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[13px] text-foreground">{children}</dd>
    </div>
  )
}

function CommentsPanel({
  comments,
  autoFocus,
  inputRef,
  onAdd,
}: {
  comments: TaskComment[]
  autoFocus: boolean
  inputRef?: React.Ref<HTMLInputElement>
  onAdd: (content: string) => void
}) {
  const [draft, setDraft] = React.useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    onAdd(content)
    setDraft("")
  }

  return (
    <div className="flex flex-col">
      {comments.length === 0 ? (
        <p className="px-6 py-6 text-[13px] text-muted-foreground">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="flex flex-col px-6 py-2">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 py-3">
              <PersonAvatar name={c.author.name} image={c.author.image} className="mt-0.5 size-7 ring-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-medium text-foreground">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">{formatUpdatedDate(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 border-t px-6 py-4">
        <Input
          ref={inputRef}
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment… use @ to mention"
          className="h-9 flex-1 bg-muted/60 text-[13px]"
        />
        <Button type="submit" size="icon-sm" variant="ghost" disabled={!draft.trim()} aria-label="Post comment">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}

/** The task's own timeline, loaded the first time the tab is opened. */
function ActivityPanel({ taskId }: { taskId: string }) {
  const { data: items, isPending } = useTaskActivity(taskId)

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 px-6 py-5" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return <p className="px-6 py-6 text-[13px] text-muted-foreground">No activity yet.</p>
  }

  return (
    <ol className="flex flex-col px-6 py-3">
      {items.map((a) => (
        <li key={a.id} className="flex min-h-11 items-center gap-3 py-1.5">
          <PersonAvatar name={a.user.name} image={a.user.image} className="size-6 ring-0" />
          <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">{a.user.name}</span> {a.description}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{formatUpdatedDate(a.createdAt)}</span>
        </li>
      ))}
    </ol>
  )
}
