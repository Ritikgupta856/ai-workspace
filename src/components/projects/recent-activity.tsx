"use client"

import * as React from "react"
import { ChevronRight, ListTree, FileText, MessageSquare, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ActivityItemData {
  id: string
  user: { name: string; initials: string }
  action: string
  target: string
  timestamp: string
  category: "task" | "document" | "chat" | "integration"
}

const activities: ActivityItemData[] = [
  {
    id: "a1",
    user: { name: "Ritik Gupta", initials: "RG" },
    action: "completed",
    target: "Design system audit",
    timestamp: "2 min ago",
    category: "task",
  },
  {
    id: "a2",
    user: { name: "Priya Sharma", initials: "PS" },
    action: "uploaded",
    target: "Q3 roadmap.md",
    timestamp: "15 min ago",
    category: "document",
  },
  {
    id: "a3",
    user: { name: "Arjun Patel", initials: "AP" },
    action: "commented on",
    target: "API rate limiting discussion",
    timestamp: "1 hour ago",
    category: "chat",
  },
  {
    id: "a4",
    user: { name: "Meera Singh", initials: "MS" },
    action: "added",
    target: "Slack integration",
    timestamp: "3 hours ago",
    category: "integration",
  },
  {
    id: "a5",
    user: { name: "Vikram Reddy", initials: "VR" },
    action: "created",
    target: "User authentication flow",
    timestamp: "5 hours ago",
    category: "task",
  },
  {
    id: "a6",
    user: { name: "Ritik Gupta", initials: "RG" },
    action: "updated",
    target: "Component library docs",
    timestamp: "Yesterday",
    category: "document",
  },
]

const categoryConfig: Record<
  string,
  { label: string; className: string; icon: typeof ListTree }
> = {
  task: {
    label: "Task",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: ListTree,
  },
  document: {
    label: "Doc",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: FileText,
  },
  chat: {
    label: "Chat",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: MessageSquare,
  },
  integration: {
    label: "Integration",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Puzzle,
  },
}

function ActivityItem({ item }: { item: ActivityItemData }) {
  const config = categoryConfig[item.category]
  const Icon = config.icon
  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">{item.user.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.user.name}</span>{" "}
          <span className="text-muted-foreground">{item.action}</span>{" "}
          <span className="font-medium">{item.target}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.timestamp}</p>
      </div>
      <Badge
        variant="secondary"
        className={cn("gap-1 px-2 py-0.5 text-[10px] font-medium shrink-0", config.className)}
      >
        <Icon className="size-3" />
        {config.label}
      </Badge>
    </div>
  )
}

export function RecentActivity() {
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
        {activities.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
