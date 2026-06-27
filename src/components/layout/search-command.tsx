"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Home,
  MessageCircle,
  FolderOpen,
  CheckSquare,
  Puzzle,
  Users,
  Settings,
  FileText,
  Calendar,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

const navigationItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Synapse AI", url: "/chat", icon: MessageCircle },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Members", url: "/members", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
]

const recentItems = [
  { title: "Design System Audit", url: "/tasks", icon: FileText },
  { title: "Synapse Dashboard", url: "/projects", icon: FolderOpen },
  { title: "Sprint Planning", url: "/tasks", icon: Calendar },
]

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  function handleSelect(url: string) {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search anything...</span>
        <div className="flex items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search your workspace..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.url}
                  onSelect={() => handleSelect(item.url)}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandGroup heading="Recent">
            {recentItems.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.title}
                  onSelect={() => handleSelect(item.url)}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
