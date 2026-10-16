"use client"

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

export const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"]

/** Light / Dark / System as a segmented control inside an open dropdown. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme()
  // Menu content only mounts once the menu opens (post-hydration), so the
  // stored theme is already known here.
  const current = theme ?? "system"

  return (
    <DropdownMenuPrimitive.RadioGroup
      value={current}
      onValueChange={setTheme}
      className="flex gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {THEME_OPTIONS.map((opt) => (
        <DropdownMenuPrimitive.RadioItem
          key={opt.value}
          value={opt.value}
          // Switching theme applies in place; the menu stays open.
          onSelect={(e) => e.preventDefault()}
          className="flex h-7 flex-1 cursor-pointer select-none items-center justify-center gap-1.5 rounded-md text-[13px] text-muted-foreground outline-none transition-colors focus:text-foreground data-[state=checked]:bg-background data-[state=checked]:font-medium data-[state=checked]:text-foreground data-[state=checked]:shadow-sm dark:text-white dark:data-[state=checked]:bg-white/15 dark:data-[state=checked]:text-white [&_svg]:size-3.5"
        >
          <opt.icon />
          {opt.label}
        </DropdownMenuPrimitive.RadioItem>
      ))}
    </DropdownMenuPrimitive.RadioGroup>
  )
}

/** Icon button for a top bar: opens a Light / Dark / System menu. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-border/80 bg-card shadow-none"
          aria-label="Change theme"
        >
          {/* Both icons render and CSS picks one, so there's no hydration
              mismatch from the not-yet-known resolved theme. */}
          <Sun className="size-3.5 dark:hidden" />
          <Moon className="hidden size-3.5 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              <opt.icon className="size-4 text-muted-foreground" />
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
