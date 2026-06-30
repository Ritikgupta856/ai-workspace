"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface ActivityItemData {
  id: string
  user: { id: string; name: string; image?: string | null }
  action: string
  description: string
  target: string
  timestamp: string
  type: string
}

const activityTypeConfig: Record<string, { label: string; className: string }> = {
  TASK_CREATED: {
    label: "Task",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  TASK_COMPLETED: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  TASK_DELETED: {
    label: "Task",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  TASK_UPDATED: {
    label: "Task",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PROJECT_CREATED: {
    label: "Project",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  PROJECT_UPDATED: {
    label: "Project",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  DOCUMENT_UPLOADED: {
    label: "Doc",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  INTEGRATION_CONNECTED: {
    label: "Integration",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  MEMBER_INVITED: {
    label: "Member",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  MEMBER_JOINED: {
    label: "Member",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  CHAT_CREATED: {
    label: "Chat",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  INVITATION_SENT: {
    label: "Invite",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  INVITATION_ACCEPTED: {
    label: "Joined",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ActivityItem({ item }: { item: ActivityItemData }) {
  const config = activityTypeConfig[item.type] || {
    label: "Event",
    className: "bg-muted text-muted-foreground",
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={item.user.image || undefined} />
        <AvatarFallback className="text-xs">{getInitials(item.user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.user.name}</span>{" "}
          <span className="text-muted-foreground">{item.description}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
      </div>
      <Badge
        variant="secondary"
        className={cn("gap-1 px-2 py-0.5 text-[10px] font-medium shrink-0", config.className)}
      >
        {config.label}
      </Badge>
    </div>
  )
}

export function RecentActivity({ activities }: { activities: ActivityItemData[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Activity</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          No activity yet. Start working to see events here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          View All
          <ChevronRight className="size-3" />
        </Button>
      </div>
      <div className="divide-y">
        {activities.slice(0, 6).map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
