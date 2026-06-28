"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface TaskChecklistCardProps {
  items: ChecklistItem[]
  onToggle?: (id: string) => void
}

export function TaskChecklistCard({ items, onToggle }: TaskChecklistCardProps) {
  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Checklist</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </div>

      <Progress value={progress} className="mb-4 h-1.5" />

      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50",
              item.completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => onToggle?.(item.id)}
              className="mt-0.5"
            />
            <span
              className={cn(
                "text-sm leading-snug",
                item.completed && "text-muted-foreground line-through"
              )}
            >
              {item.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
