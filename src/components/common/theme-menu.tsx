"use client"

import { useTheme } from "next-themes"
import { Monitor, Moon, Sun, SunMoon } from "lucide-react"

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

export const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export type ThemeValue = (typeof THEME_OPTIONS)[number]["value"]

/** "Theme ▸ Light / Dark / System" submenu for any dropdown. */
export function ThemeSubmenu() {
  const { theme, setTheme } = useTheme()
  // The submenu only renders after the menu opens (post-hydration), so the
  // stored theme is already known here.
  const current = theme ?? "system"

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SunMoon className="mr-2 size-4" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-36">
        <DropdownMenuRadioGroup value={current} onValueChange={setTheme}>
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              <opt.icon className="size-4 text-muted-foreground" />
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
