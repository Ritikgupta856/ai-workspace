"use client"

import * as React from "react"

import { toast } from "sonner"
import {
  CheckCircle2,
  Circle,
  Link2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TaskDetailBody, projectDot } from "@/components/tasks/task-detail-body"
import { taskKey } from "@/components/tasks/task-grouped-list"
import { useQueryClient } from "@tanstack/react-query"
import { deleteTask, fetchTask, updateTask, type TaskDetail } from "@/lib/api/tasks"
import { queryKeys } from "@/lib/query/keys"
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

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function TaskDetailSheet({ task, open, onOpenChange, onChanged, onDeleted }: TaskDetailSheetProps) {
  const client = useQueryClient()
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [wide, setWide] = React.useState(false)

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

  // The status the header shows: the loaded record if we have it, else the list row.
  const status = detail?.status ?? task?.status
  const done = status === "DONE"

  async function toggleComplete() {
    if (!task) return
    const next = done ? "TODO" : "DONE"
    patchTaskPanel(client, task.id, (p) => ({ ...p, task: { ...p.task, status: next } }))
    try {
      await updateTask(task.id, { status: next })
      handleChanged(await fetchTask(task.id))
      client.invalidateQueries({ queryKey: queryKeys.tasks.activity(task.id) })
    } catch (err) {
      patchTaskPanel(client, task.id, (p) => ({ ...p, task: { ...p.task, status: done ? "DONE" : p.task.status } }))
      toast.error(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  async function copyLink() {
    if (!task) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?task=${task.id}`)
      toast.success("Link copied")
    } catch {
      toast.error("Couldn't copy the link")
    }
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
          showCloseButton={false}
          className={cn(
            "flex w-full flex-col gap-0 p-0",
            wide
              ? // Expanded: a wide panel centred on screen instead of docked to the right.
                "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(880px,calc(100dvh-48px))] sm:w-[min(960px,calc(100vw-48px))] sm:max-w-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-hidden sm:rounded-xl sm:border"
              : "sm:max-w-[620px]"
          )}
        >
          {!task ? null : (
            <>
              <SheetTitle className="sr-only">{task.title}</SheetTitle>
              <SheetDescription className="sr-only">Task details</SheetDescription>

              {/* Header */}
              <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-6">
                <div className="flex min-w-0 items-center gap-2 text-[13px]">
                  {task.projectId ? (
                    <span className={cn("size-2 shrink-0 rounded-full", projectDot(task.projectId))} />
                  ) : null}
                  <span className="max-w-48 truncate text-foreground">{task.project ?? "No project"}</span>
                  <span className="text-muted-foreground/60">/</span>
                  <span className="font-mono text-xs tracking-wide text-muted-foreground">{taskKey(task)}</span>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={toggleComplete}
                    className={cn(
                      "mr-1.5 inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors hover:bg-muted",
                      done ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/80 hover:text-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                    {done ? "Completed" : "Mark complete"}
                  </button>
                  <HeaderIconButton label={favorited ? "Unfavorite" : "Favorite"} onClick={toggleFavorite}>
                    <Star className={cn("size-4", favorited && "fill-amber-400 text-amber-400")} />
                  </HeaderIconButton>
                  <HeaderIconButton label="Copy link" onClick={copyLink}>
                    <Link2 className="size-4" />
                  </HeaderIconButton>
                  <HeaderIconButton label={wide ? "Collapse" : "Expand"} onClick={() => setWide((w) => !w)}>
                    {wide ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </HeaderIconButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="More"
                        className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
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
                  <SheetClose
                    aria-label="Close"
                    className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </SheetClose>
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
 * What the panel shows while its data loads: the title the list already
 * knows, with placeholders laid out like the real body so nothing jumps.
 */
function TaskPanelSkeleton({ task }: { task: Task }) {
  return (
    <div aria-busy="true" aria-label="Loading task" className="px-6 pt-5 pb-8">
      <h2 className="px-0 py-1 text-lg leading-7 font-semibold tracking-tight text-foreground">{task.title}</h2>
      <div className="mt-4 flex flex-col">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex h-8 items-center gap-2">
            <div className="flex w-[118px] items-center gap-2.5">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className={cn("h-3.5", i % 2 ? "w-20" : "w-28")} />
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-3.5 w-24" />
      <Skeleton className="mt-3 h-16 w-full" />
      <Skeleton className="mt-8 h-3.5 w-20" />
      <Skeleton className="mt-3 h-3.5 w-28" />
    </div>
  )
}
