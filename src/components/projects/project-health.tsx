"use client"

import * as React from "react"
import {
  CheckCircle2,
  AlertCircle,
  CircleDashed,
  UserX,
  FileText,
  Activity,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface HealthData {
  activeTasks: number
  completedThisWeek: number
  overdueTasks: number
  unassignedTasks: number
  documentsUpdated: number
  score: "excellent" | "good" | "needsAttention" | "atRisk"
}

const healthConfig: Record<string, { label: string; className: string; icon: typeof Activity }> = {
  excellent: {
    label: "Excellent",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  good: {
    label: "Good",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle2,
  },
  needsAttention: {
    label: "Needs Attention",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: AlertCircle,
  },
  atRisk: {
    label: "At Risk",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
}

export function ProjectHealth({ health }: { health: HealthData }) {
  const config = healthConfig[health.score] || healthConfig.good
  const HealthIcon = config.icon

  const metrics = [
    { label: "Active Tasks", value: health.activeTasks, icon: <CircleDashed className="size-4 text-blue-500" /> },
    { label: "Completed This Week", value: health.completedThisWeek, icon: <CheckCircle2 className="size-4 text-emerald-500" /> },
    { label: "Overdue Tasks", value: health.overdueTasks, icon: <AlertCircle className="size-4 text-red-500" /> },
    { label: "Unassigned Tasks", value: health.unassignedTasks, icon: <UserX className="size-4 text-amber-500" /> },
    { label: "Documents Updated", value: health.documentsUpdated, icon: <FileText className="size-4 text-violet-500" /> },
  ]

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Project Health</h3>
        <Badge
          variant="secondary"
          className={cn("gap-1", config.className)}
        >
          <HealthIcon className="size-3" />
          {config.label}
        </Badge>
      </div>
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metric.icon}
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
