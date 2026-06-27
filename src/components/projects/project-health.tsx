"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, CircleDashed, UserX, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface HealthMetric {
  label: string
  value: number
  icon: React.ReactNode
}

const metrics: HealthMetric[] = [
  { label: "Active Tasks", value: 48, icon: <CircleDashed className="size-4 text-blue-500" /> },
  { label: "Completed This Week", value: 23, icon: <CheckCircle2 className="size-4 text-emerald-500" /> },
  { label: "Overdue Tasks", value: 7, icon: <AlertCircle className="size-4 text-red-500" /> },
  { label: "Unassigned Tasks", value: 12, icon: <UserX className="size-4 text-amber-500" /> },
  { label: "Documents Updated", value: 18, icon: <FileText className="size-4 text-violet-500" /> },
]

export function ProjectHealth() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Project Health</h3>
        <Badge
          variant="secondary"
          className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-3" />
          Good
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
