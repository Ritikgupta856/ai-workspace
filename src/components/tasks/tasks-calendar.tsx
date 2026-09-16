"use client"

import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Task } from "@/components/tasks/tasks-view"

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-muted-foreground/50",
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const MAX_VISIBLE_PER_DAY = 3

export function TasksCalendar({
  tasks,
  onSelectTask,
}: {
  tasks: Task[]
  onSelectTask: (task: Task) => void
}) {
  const [cursor, setCursor] = React.useState(() => new Date())

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(cursor)
    const monthEnd = endOfMonth(cursor)
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    })
  }, [cursor])

  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const key = format(new Date(task.dueDate), "yyyy-MM-dd")
      const bucket = map.get(key)
      if (bucket) bucket.push(task)
      else map.set(key, [task])
    }
    return map
  }, [tasks])

  const undated = React.useMemo(() => tasks.filter((t) => !t.dueDate), [tasks])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
            className="text-xs"
          >
            Today
          </Button>
          <div className="flex items-center overflow-hidden rounded-md border">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              onClick={() => setCursor((d) => subMonths(d, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              onClick={() => setCursor((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, "yyyy-MM-dd")
            const dayTasks = tasksByDay.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const today = isToday(day)
            const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY)
            const overflow = dayTasks.length - visible.length
            const isLastCol = (i + 1) % 7 === 0

            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-[108px] flex-col gap-1 border-b p-1.5 transition-colors",
                  !isLastCol && "border-r",
                  !inMonth && "bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                    today
                      ? "bg-primary font-semibold text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  )}
                >
                  {format(day, "d")}
                </span>

                <div className="flex flex-col gap-1">
                  {visible.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-colors hover:bg-accent",
                        task.status === "DONE"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          PRIORITY_DOT[task.priority]
                        )}
                      />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                  {overflow > 0 && (
                    <span className="px-1.5 text-[10px] text-muted-foreground">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {undated.length > 0 ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">
            No due date · {undated.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {undated.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelectTask(task)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent",
                  task.status === "DONE" && "text-muted-foreground line-through"
                )}
              >
                <span className={cn("size-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
                {task.title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <CalendarX className="size-6" />
            <p className="text-sm font-medium text-foreground">Nothing on the calendar</p>
            <p className="text-xs">Tasks with a due date will show up here.</p>
          </div>
        )
      )}
    </div>
  )
}
