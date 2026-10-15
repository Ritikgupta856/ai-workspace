"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ViewSwitchOption<T extends string> {
  value: T
  label: string
  icon: LucideIcon
}

/**
 * The segmented List / Kanban / Calendar (or List / Grid) control. It sits at
 * the right end of a page's search row, next to the filters it works with.
 */
export function ViewSwitch<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly ViewSwitchOption<T>[]
  className?: string
}) {
  return (
    <div className={cn("flex items-center rounded-lg bg-muted p-0.5", className)} role="tablist" aria-label="View">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors",
              active ? "bg-card font-medium text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="size-3.5" />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
