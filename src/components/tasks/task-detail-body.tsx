"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { TaskCommentsSection } from "@/components/tasks/task-comments-section"
import { LabelMultiSelect } from "@/components/tasks/task-dialog"
import { taskKey } from "@/components/tasks/task-grouped-list"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { format } from "date-fns"
import { fetchTask, fetchTasks, createTask, updateTask, type TaskDetail } from "@/lib/api/tasks"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus, TaskPriority } from "@/components/tasks/tasks-view"

const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({ value, ...config }))
const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({ value, ...config }))

type MemberOption = { userId: string; name: string; avatar: string | null }

type TaskCommentDTO = {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; image: string | null }
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export interface TaskDetailBodyProps {
  task: TaskDetail
  onChanged: (task: TaskDetail) => void
}

/**
 * Render this keyed by `task.id` (both call sites do) so switching to a
 * different task remounts fresh local state instead of needing an effect to
 * re-sync it — keeps setState out of effect bodies per DESIGN.local.md §6.
 */
export function TaskDetailBody({ task, onChanged }: TaskDetailBodyProps) {
  const router = useRouter()
  const slug = useParams().slug as string
  const [title, setTitle] = React.useState(task.title)
  const [description, setDescription] = React.useState(task.description)
  const [membersList, setMembersList] = React.useState<MemberOption[]>([])
  const [comments, setComments] = React.useState<TaskCommentDTO[]>([])
  const [detailsOpen, setDetailsOpen] = React.useState(true)
  const [parentPickerOpen, setParentPickerOpen] = React.useState(false)
  const [parentCandidates, setParentCandidates] = React.useState<Task[]>([])
  const [addingSubtask, setAddingSubtask] = React.useState(false)
  const [subtaskTitle, setSubtaskTitle] = React.useState("")

  // Assignable people are scoped to this task's project; a project-less
  // task has nothing to scope to, so fall back to the full workspace roster.
  React.useEffect(() => {
    const url = task.projectId ? `/api/projects/${task.projectId}/members` : "/api/workspaces/members"
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return setMembersList([])
        const members: MemberOption[] = task.projectId
          ? j.members.map((m: { id: string; name: string; image: string | null }) => ({
              userId: m.id,
              name: m.name,
              avatar: m.image,
            }))
          : j.members.map((m: { userId: string; name: string; avatar: string | null }) => ({
              userId: m.userId,
              name: m.name,
              avatar: m.avatar,
            }))
        setMembersList(members)
      })
      .catch(() => setMembersList([]))
  }, [task.projectId])

  const loadComments = React.useCallback(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setComments(json.comments) })
      .catch(() => {})
  }, [task.id])

  React.useEffect(() => {
    loadComments()
  }, [loadComments])

  async function handleAddComment(content: string) {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to post comment")
      loadComments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post comment")
    }
  }

  async function persist(patch: Parameters<typeof updateTask>[1]) {
    try {
      await updateTask(task.id, patch)
      const fresh = await fetchTask(task.id)
      onChanged(fresh)
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

  const statusConfig = TASK_STATUS_CONFIG[task.status]
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority]

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{taskKey(task)}</div>

      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        rows={1}
        placeholder="Task title"
        className="mt-1 w-full resize-none overflow-hidden border-0 bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
      />

      {/* Properties */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={task.status} onValueChange={(v) => persist({ status: v as TaskStatus })}>
          <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 shadow-none [&>svg]:opacity-60">
            <SelectValue>
              <StatusBadge label={statusConfig.label} className={statusConfig.className} icon={statusConfig.icon} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", opt.className)}>
                    <Icon className="size-3" />
                    {opt.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select value={task.priority} onValueChange={(v) => persist({ priority: v as TaskPriority })}>
          <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 shadow-none [&>svg]:opacity-60">
            <SelectValue>
              <StatusBadge label={priorityConfig.label} className={priorityConfig.className} icon={priorityConfig.icon} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", opt.className)}>
                    <Icon className="size-3" />
                    {opt.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <Select
          value={task.assigneeId ?? "unassigned"}
          onValueChange={(v) => persist({ assigneeId: v === "unassigned" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 shadow-none text-xs [&>svg]:opacity-60">
            <SelectValue placeholder="Add assignee">
              <div className="flex items-center gap-1.5">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[9px]">
                    {task.assignee && task.assignee !== "Unassigned" ? getInitials(task.assignee) : "?"}
                  </AvatarFallback>
                </Avatar>
                {task.assignee && task.assignee !== "Unassigned" ? task.assignee : "Unassigned"}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {membersList.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  {m.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 gap-1.5 bg-muted px-2.5 font-normal", !task.dueDate && "text-muted-foreground")}
            >
              <CalendarIcon className="size-3.5" />
              {task.dueDate ? formatDueDate(task.dueDate) : "Due date"}
            </Button>
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
      </div>

      {/* Description */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        placeholder="Add a description..."
        className="mt-6 min-h-[120px] resize-y border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
      />

      {/* Properties / Details */}
      <div className="mt-8">
        <div className="text-xs font-medium text-muted-foreground">Properties</div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {detailsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          Details
        </button>

        {detailsOpen && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">Parent</span>
              <Popover open={parentPickerOpen} onOpenChange={openParentPicker}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 font-normal">
                    {task.parent ? task.parent.title : "Add parent"}
                    <ChevronsUpDown className="size-3 opacity-50" />
                  </Button>
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
            </div>

            <div className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">Labels</span>
              <div className="max-w-72 flex-1">
                <LabelMultiSelect
                  selected={task.labels}
                  onChange={(labels) => persist({ labels })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-work items */}
      <div className="mt-6">
        <div className="text-xs font-medium text-muted-foreground">Sub-work items</div>
        <div className="mt-2 space-y-1">
          {task.subtasks.map((sub) => {
            const subStatus = TASK_STATUS_CONFIG[sub.status]
            const SubIcon = subStatus.icon
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => router.push(`/${slug}/tasks/${sub.id}`)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                <SubIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{sub.title}</span>
              </button>
            )
          })}

          {addingSubtask ? (
            <div className="flex items-center gap-2 px-1.5 py-1">
              <Input
                autoFocus
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubtask()
                  if (e.key === "Escape") { setAddingSubtask(false); setSubtaskTitle("") }
                }}
                onBlur={() => { if (!subtaskTitle.trim()) setAddingSubtask(false) }}
                placeholder="Sub-work item title"
                className="h-8"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSubtask(true)}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Add sub-work item
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Created by {task.createdBy} on {new Date(task.createdAt).toLocaleDateString()} · Updated {formatUpdatedDate(task.updatedAt)}
      </p>

      <div className="mt-6">
        <TaskCommentsSection
          comments={comments.map((c) => ({
            id: c.id,
            author: c.author.name,
            content: c.content,
            createdAt: c.createdAt,
            reactions: [],
          }))}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  )
}
