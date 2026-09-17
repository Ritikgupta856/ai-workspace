"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** 32px outlined pill shared by every list toolbar (Group by / Sort / Filter …). */
export const toolbarPillClass =
  "h-8 gap-1.5 rounded-lg border-border/80 px-2.5 text-[13px] font-normal shadow-none"

export interface ToolbarSelectOption<T extends string> {
  value: T
  label: string
  /** Shorter text for the pill itself when the menu label is long. */
  pill?: string
}

/** Pill-style dropdown: "Group by **Status**". The prefix drops on narrow laptops. */
export function ToolbarSelect<T extends string>({
  icon: Icon,
  prefix,
  value,
  options,
  onChange,
}: {
  icon: React.ElementType
  prefix: string
  value: T
  options: ToolbarSelectOption<T>[]
  onChange: (v: T) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={toolbarPillClass}>
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="hidden text-muted-foreground lg:inline">{prefix}</span>
          <span className="font-medium text-foreground">{current?.pill ?? current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
