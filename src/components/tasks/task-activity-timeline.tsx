"use client"

import * as React from "react"
import {
  ArrowRight,
  GitPullRequest,
  MessageSquare,
  FileUp,
  Bot,
  CalendarDays,
  CheckCircle2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type:
    | "status_change"
    | "pr_linked"
    | "comment_added"
    | "document_uploaded"
    | "ai_generated"
    | "due_date_updated"
    | "task_completed"
  actor: string
  description: string
  timestamp: string
}

interface TaskActivityTimelineProps {
  activities: Activity[]
}

const activityIcons = {
  status_change: ArrowRight,
  pr_linked: GitPullRequest,
  comment_added: MessageSquare,
  document_uploaded: FileUp,
  ai_generated: Bot,
  due_date_updated: CalendarDays,
  task_completed: CheckCircle2,
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskActivityTimeline({ activities }: TaskActivityTimelineProps) {
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, act) => {
    const date = new Date(act.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(act)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {date}
          </h4>
          <div className="relative space-y-0">
            <div className="absolute left-4 top-2 h-[calc(100%-16px)] w-px bg-border" />
            {items.map((activity, idx) => {
              const Icon = activityIcons[activity.type]
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "relative flex gap-4 pb-6",
                    idx === items.length - 1 && "pb-0"
                  )}
                >
                  <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-start gap-3 pt-1">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(activity.actor)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.actor}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.description}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatUpdatedDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
