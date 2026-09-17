"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ViewToggleOption<T extends string> {
  value: T
  icon: LucideIcon
  label: string
}

/** Compact segmented icon toggle used in page headers to mirror the toolbar's view tabs. */
export function ViewToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: ViewToggleOption<T>[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center rounded-lg bg-muted p-0.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          className={cn(
            "flex size-6.5 items-center justify-center rounded-md transition-colors",
            value === opt.value
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <opt.icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
