"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  CalendarIcon,
  CheckSquare,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/common/status-badge"
import { TaskCommentsSection } from "@/components/tasks/task-comments-section"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import { formatDueDate, formatUpdatedDate } from "@/lib/date"
import { format } from "date-fns"
import { updateTask, deleteTask } from "@/lib/api/tasks"
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

export interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: (task: Task) => void
  onDeleted?: (id: string) => void
}

export function TaskDetailSheet({ task, open, onOpenChange, onChanged, onDeleted }: TaskDetailSheetProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [membersList, setMembersList] = React.useState<MemberOption[]>([])
  const [favorited, setFavorited] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [comments, setComments] = React.useState<TaskCommentDTO[]>([])

  React.useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description)
  }, [task])

  React.useEffect(() => {
    if (!open) return
    fetch("/api/workspaces/members")
      .then((r) => r.json())
      .then((j) => setMembersList(j.success ? j.members : []))
      .catch(() => {})
  }, [open])

  React.useEffect(() => {
    if (!open || !task) return
    fetch(`/api/favorites?entityType=TASK&entityId=${task.id}`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setFavorited(json.favorited) })
      .catch(() => {})
  }, [open, task?.id])

  const loadComments = React.useCallback(() => {
    if (!task) return
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setComments(json.comments) })
      .catch(() => {})
  }, [task])

  React.useEffect(() => {
    if (open) loadComments()
  }, [open, loadComments])

  async function handleAddComment(content: string) {
    if (!task) return
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
    if (!task) return
    try {
      const updated = await updateTask(task.id, patch)
      onChanged?.(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  function handleTitleBlur() {
    if (!task) return
    const trimmed = title.trim() || "Untitled"
    if (trimmed !== task.title) persist({ title: trimmed })
  }

  function handleDescriptionBlur() {
    if (!task) return
    if (description !== task.description) persist({ description })
  }

  async function toggleFavorite() {
    if (!task) return
    const next = !favorited
    setFavorited(next)
    try {
      await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "TASK", entityId: task.id }),
      })
    } catch {
      setFavorited(!next)
      toast.error("Failed to update favorite")
    }
  }

  async function handleDelete() {
    if (!task) return
    try {
      await deleteTask(task.id)
      toast.success("Task deleted")
      setConfirmDelete(false)
      onDeleted?.(task.id)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task")
      setConfirmDelete(false)
    }
  }

  const statusConfig = task ? TASK_STATUS_CONFIG[task.status] : null
  const priorityConfig = task ? TASK_PRIORITY_CONFIG[task.priority] : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        >
          {!task ? null : (
            <>
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckSquare className="size-4 shrink-0" />
                  <span className="max-w-48 truncate">{task.project ?? "Tasks"}</span>
                  <span>/</span>
                  <span className="max-w-48 truncate text-foreground">Work item</span>
                </div>
                <div className="mr-6 flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleFavorite}
                    aria-label={favorited ? "Unfavorite" : "Favorite"}
                  >
                    <Star className={cn("size-4", favorited && "fill-amber-400 text-amber-400")} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setConfirmDelete(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  rows={1}
                  placeholder="Task title"
                  className="w-full resize-none overflow-hidden border-0 bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                />

                {/* Properties */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Select
                    value={task.status}
                    onValueChange={(v) => persist({ status: v as TaskStatus })}
                  >
                    <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 shadow-none [&>svg]:opacity-60">
                      <SelectValue>
                        {statusConfig && (
                          <StatusBadge label={statusConfig.label} className={statusConfig.className} icon={statusConfig.icon} />
                        )}
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

                  <Select
                    value={task.priority}
                    onValueChange={(v) => persist({ priority: v as TaskPriority })}
                  >
                    <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-muted px-2.5 shadow-none [&>svg]:opacity-60">
                      <SelectValue>
                        {priorityConfig && (
                          <StatusBadge label={priorityConfig.label} className={priorityConfig.className} icon={priorityConfig.icon} />
                        )}
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
                        className={cn(
                          "h-8 gap-1.5 bg-muted px-2.5 font-normal",
                          !task.dueDate && "text-muted-foreground"
                        )}
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

                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatUpdatedDate(task.updatedAt)}
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
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              &ldquo;{task?.title}&rdquo; will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
