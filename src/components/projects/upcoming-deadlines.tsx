"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface DeadlineData {
  id: string
  taskName: string
  dueDate: string
  dueDateLabel: string
  priority: string
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  LOW: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
}

export function UpcomingDeadlines({ deadlines }: { deadlines: DeadlineData[] }) {
  if (deadlines.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          No upcoming deadlines. All clear!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
      <div className="space-y-3">
        {deadlines.map((dl) => {
          const config = priorityConfig[dl.priority] || priorityConfig.LOW
          return (
            <div key={dl.id} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CalendarDays className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{dl.dueDateLabel}</p>
                <p className="truncate text-sm font-medium text-foreground">{dl.taskName}</p>
                <p className="text-xs text-muted-foreground">Due {dl.dueDateLabel}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn("px-2 py-0.5 text-[10px] font-medium shrink-0", config.className)}
              >
                {config.label}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
