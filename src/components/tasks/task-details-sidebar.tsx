"use client"

import * as React from "react"
import {
  Clock,
  User,
  CalendarDays,
  Tag,
  Bot,
  BookOpen,
  ListTodo,
  MessageSquare,
  Copy,
  Trash2,
  Archive,
  FileSymlink,
  GitPullRequest,
} from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import { formatCreatedDate, formatDateTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { TaskStatusKey, TaskPriorityKey } from "@/lib/constants/task"

interface TaskDetailsSidebarProps {
  status: TaskStatusKey
  priority: TaskPriorityKey
  assignee: string
  project: string
  dueDate: string | null
  labels: string[]
  estimatedTime: number | null
  createdBy: string
  createdAt: string
  updatedAt: string
  onAssign?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onCopyLink?: () => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskDetailsSidebar({
  status,
  priority,
  assignee,
  project,
  dueDate,
  labels,
  estimatedTime,
  createdBy,
  createdAt,
  updatedAt,
  onAssign,
  onDuplicate,
  onArchive,
  onDelete,
  onCopyLink,
}: TaskDetailsSidebarProps) {
  const statusConfig = TASK_STATUS_CONFIG[status]
  const priorityConfig = TASK_PRIORITY_CONFIG[priority]

  return (
    <div className="space-y-4">
      {/* Task Details Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Task Details
        </h4>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge
              label={statusConfig.label}
              className={statusConfig.className}
              icon={statusConfig.icon}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority</span>
            <StatusBadge
              label={priorityConfig.label}
              className={priorityConfig.className}
              icon={priorityConfig.icon}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Assignee</span>
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">
                  {getInitials(assignee)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                {assignee}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Project</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {project}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Due Date</span>
            <span
              className={cn(
                "text-sm font-medium",
                dueDate ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {dueDate
                ? new Date(dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Not set"}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Labels</span>
            <div className="flex flex-wrap gap-1">
              {labels.length > 0 ? (
                labels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="text-[11px] font-normal"
                  >
                    {label}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Est. Time</span>
            <span className="text-sm font-medium text-foreground">
              {estimatedTime ? `${estimatedTime}h` : "—"}
            </span>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3" />
              <span>
                Created by <span className="font-medium text-foreground">{createdBy}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span>{formatCreatedDate(createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>Updated {formatDateTime(updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bot className="size-3.5" />
            AI Summary
          </h4>
          <Badge
            variant="secondary"
            className="text-[10px] font-normal text-green-600"
          >
            High confidence
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This task involves fixing an authentication bug in the staging
          environment. The issue appears to be related to token refresh logic in
          the middleware layer.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          <span>3 sources analyzed</span>
        </div>
      </div>

      {/* Related Resources Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Related Resources
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <GitPullRequest className="size-4" />
            GitHub
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FileSymlink className="size-4" />
            Documents
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ListTodo className="size-4" />
            Similar Tasks
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MessageSquare className="size-4" />
            Recent AI Conversations
          </button>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onAssign}>
            Assign
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={onArchive}>
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCopyLink}
            className="col-span-2"
          >
            <Copy className="size-3.5" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  )
}
