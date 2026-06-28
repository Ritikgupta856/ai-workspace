"use client"

import * as React from "react"
import { CalendarDays, User } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/lib/constants"
import type { TaskStatusKey, TaskPriorityKey } from "@/lib/constants/task"

interface TaskMetadataBarProps {
  status: TaskStatusKey
  priority: TaskPriorityKey
  assignee: string
  project: string
  dueDate: string | null
  onStatusChange?: (status: TaskStatusKey) => void
  onPriorityChange?: (priority: TaskPriorityKey) => void
  onAssigneeChange?: (assignee: string) => void
  onDueDateChange?: (date: string | null) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskMetadataBar({
  status,
  priority,
  assignee,
  project,
  dueDate,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
}: TaskMetadataBarProps) {
  const statusConfig = TASK_STATUS_CONFIG[status]
  const priorityConfig = TASK_PRIORITY_CONFIG[priority]

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange?.(v as TaskStatusKey)}
          >
            <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus:ring-0 [&>svg]:hidden">
              <SelectValue>
                <StatusBadge
                  label={statusConfig.label}
                  className={statusConfig.className}
                  icon={statusConfig.icon}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatusKey, typeof statusConfig][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <StatusBadge
                      label={config.label}
                      className={config.className}
                      icon={config.icon}
                    />
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Priority</p>
          <Select
            value={priority}
            onValueChange={(v) => onPriorityChange?.(v as TaskPriorityKey)}
          >
            <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus:ring-0 [&>svg]:hidden">
              <SelectValue>
                <StatusBadge
                  label={priorityConfig.label}
                  className={priorityConfig.className}
                  icon={priorityConfig.icon}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriorityKey, typeof priorityConfig][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <StatusBadge
                      label={config.label}
                      className={config.className}
                      icon={config.icon}
                    />
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Assignee</p>
          <Select
            value={assignee}
            onValueChange={(v) => onAssigneeChange?.(v)}
          >
            <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus:ring-0">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(assignee)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{assignee}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ritik Gupta">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">RG</AvatarFallback>
                  </Avatar>
                  <span>Ritik Gupta</span>
                </div>
              </SelectItem>
              <SelectItem value="Priya Sharma">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">PS</AvatarFallback>
                  </Avatar>
                  <span>Priya Sharma</span>
                </div>
              </SelectItem>
              <SelectItem value="Arjun Patel">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">AP</AvatarFallback>
                  </Avatar>
                  <span>Arjun Patel</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Due Date</p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-8 items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="size-3.5" />
                {dueDate ? format(new Date(dueDate), "MMM d") : "Set date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate ? new Date(dueDate) : undefined}
                onSelect={(date) =>
                  onDueDateChange?.(date ? date.toISOString() : null)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Project</p>
          <Badge variant="secondary" className="text-sm font-medium">
            {project}
          </Badge>
        </div>
      </div>
    </div>
  )
}
