"use client"

import * as React from "react"

import { toast } from "sonner"
import {
  CheckSquare,
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
import { Skeleton } from "@/components/ui/skeleton"
import { TaskDetailBody } from "@/components/tasks/task-detail-body"
import { taskKey } from "@/components/tasks/task-grouped-list"
import { useQueryClient } from "@tanstack/react-query"
import { deleteTask, type TaskDetail } from "@/lib/api/tasks"
import { patchTaskPanel, useTaskPanel } from "@/lib/query/tasks"
import { useFavorite } from "@/lib/query/favorites"
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
  const client = useQueryClient()
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  // One cached request fills the whole panel (task, comments, assignees,
  // favourite). Hovering the task already started it, so a click usually
  // opens onto data that has arrived; reopening a task shows its cached copy
  // at once and refreshes it in the background once it goes stale.
  const taskId = task?.id
  const { data: panel } = useTaskPanel(open ? taskId : undefined)
  const detail = panel?.task ?? null
  // The panel payload already says whether it's starred, so the star needs no request of its own.
  const { favorited, toggle: toggleFavorite } = useFavorite("TASK", taskId ?? "", panel?.favorited, { enabled: Boolean(panel) })

  const handleOpenChange = onOpenChange

  function handleChanged(updated: TaskDetail) {
    patchTaskPanel(client, updated.id, (p) => ({ ...p, task: updated }))
    onChanged?.(updated)
  }

  async function handleDelete() {
    if (!task) return
    try {
      await deleteTask(task.id)
      toast.success("Task deleted")
      setConfirmDelete(false)
      onDeleted?.(task.id)
      handleOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task")
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
        >
          {!task ? null : (
            <>
              {/* Header */}
              <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-5">
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckSquare className="size-4 shrink-0" />
                  <span className="max-w-48 truncate">{task.project ?? "Tasks"}</span>
                  <span>/</span>
                  <span className="font-mono text-xs tracking-wide text-foreground">{taskKey(task)}</span>
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
              <div className="min-h-0 flex-1 overflow-y-auto">
                {panel && detail && detail.id === task.id ? (
                  <TaskDetailBody
                    key={detail.id}
                    task={detail}
                    initialComments={panel.comments}
                    initialMembers={panel.members}
                    onChanged={handleChanged}
                  />
                ) : (
                  <TaskPanelSkeleton task={task} />
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

/**
 * What the panel shows while its data loads: the title and key the list
 * already knows, with placeholders laid out like the real body so nothing
 * jumps when it arrives.
 */
function TaskPanelSkeleton({ task }: { task: Task }) {
  return (
    <div aria-busy="true" aria-label="Loading task">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-xl leading-snug font-semibold tracking-tight text-foreground">{task.title}</h2>
            <div className="mt-1 font-mono text-xs tracking-wide text-muted-foreground">{taskKey(task)}</div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex h-11 items-center gap-6 border-y px-6">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="flex flex-col gap-5 px-6 py-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        ))}
      </div>
    </div>
  )
}
