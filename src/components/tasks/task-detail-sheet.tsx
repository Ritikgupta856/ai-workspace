"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CheckSquare,
  Maximize2,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
import { TaskDetailBody } from "@/components/tasks/task-detail-body"
import { fetchTask, deleteTask, type TaskDetail } from "@/lib/api/tasks"
import { cn } from "@/lib/utils"
import type { Task } from "@/components/tasks/tasks-view"

export interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: (task: Task) => void
  onDeleted?: (id: string) => void
}

export function TaskDetailSheet({ task, open, onOpenChange, onChanged, onDeleted }: TaskDetailSheetProps) {
  const router = useRouter()
  const slug = useParams().slug as string
  const [detail, setDetail] = React.useState<TaskDetail | null>(null)
  const [favorited, setFavorited] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  React.useEffect(() => {
    if (!open || !task) return
    let cancelled = false
    fetchTask(task.id)
      .then((full) => { if (!cancelled) setDetail(full) })
      .catch(() => { if (!cancelled) setDetail(null) })
    return () => { cancelled = true }
  }, [open, task])

  React.useEffect(() => {
    if (!open || !task) return
    fetch(`/api/favorites?entityType=TASK&entityId=${task.id}`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setFavorited(json.favorited) })
      .catch(() => {})
  }, [open, task?.id])

  function handleChanged(updated: TaskDetail) {
    setDetail(updated)
    onChanged?.(updated)
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

  function handleOpenInPage() {
    if (!task) return
    onOpenChange(false)
    router.push(`/${slug}/tasks/${task.id}`)
  }

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
                    onClick={handleOpenInPage}
                    aria-label="Open in page"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
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
                {detail && detail.id === task.id && (
                  <TaskDetailBody key={detail.id} task={detail} onChanged={handleChanged} />
                )}
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
