"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { CheckSquare, MoreHorizontal, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { NoteDetailSkeleton } from "@/components/dashboard/loading-states"
import { TaskDetailBody } from "@/components/tasks/task-detail-body"
import { taskKey } from "@/components/tasks/task-grouped-list"
import { fetchTask, deleteTask, type TaskDetail } from "@/lib/api/tasks"
import { cn } from "@/lib/utils"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.taskId as string
  const slug = params.slug as string

  const [task, setTask] = React.useState<TaskDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [favorited, setFavorited] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTask(taskId)
      .then((full) => { if (!cancelled) setTask(full) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load task") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [taskId])

  React.useEffect(() => {
    fetch(`/api/favorites?entityType=TASK&entityId=${taskId}`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setFavorited(json.favorited) })
      .catch(() => {})
  }, [taskId])

  async function toggleFavorite() {
    const next = !favorited
    setFavorited(next)
    try {
      await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "TASK", entityId: taskId }),
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
      router.push(task.projectId ? `/${slug}/projects/${task.projectId}/tasks` : `/${slug}/my-work`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task")
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <NoteDetailSkeleton />
  }

  if (error || !task) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-destructive">
        {error ?? "Task not found"}
      </div>
    )
  }

  const tasksRoot = task.projectId ? `/${slug}/projects/${task.projectId}/tasks` : `/${slug}/my-work`
  const rootLabel = task.project ?? "My work"

  return (
    <div className="flex flex-1 flex-col">
      {/* Breadcrumb bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-sm text-muted-foreground">
          <Link
            href={tasksRoot}
            className="flex min-w-0 shrink-0 items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent hover:text-foreground"
          >
            <CheckSquare className="size-3.5 shrink-0" />
            <span className="max-w-40 truncate">{rootLabel}</span>
          </Link>
          <span className="shrink-0">/</span>
          <span className="min-w-0 truncate rounded px-1.5 py-1 font-medium text-foreground">
            {taskKey(task)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10 sm:px-12">
          <TaskDetailBody key={task.id} task={task} onChanged={setTask} />
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              &ldquo;{task.title}&rdquo; will be permanently removed. This cannot be undone.
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
    </div>
  )
}
