"use client"

import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * The search field for a list toolbar.
 *
 * Searching used to be offered twice on the same screen — a "Search" button in
 * the section header and a magnifying-glass button in the toolbar below it —
 * and each one opened a different field. This is the only one now, and it sits
 * where the results are.
 *
 * It also stays open. The old field was hidden behind a button that swapped
 * itself for an input, which cost a click before you could type, shifted the
 * toolbar as it appeared, and hid whatever you had already searched for the
 * moment it closed.
 */
export function ToolbarSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Accessible name; defaults to the placeholder. */
  label?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cn(
          "border-border/80 h-8 w-40 rounded-lg pr-7 pl-7 text-[13px] shadow-none transition-[width]",
          "focus-visible:w-56 lg:w-48",
          // Safari draws its own clear button on type=search, which would sit
          // on top of ours.
          "[&::-webkit-search-cancel-button]:appearance-none"
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault()
            onChange("")
          }
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
