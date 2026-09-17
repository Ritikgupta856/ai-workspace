"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import {
  Search,
  Sparkles,
  Home,
  Inbox,
  ListChecks,
  Bot,
  FolderOpen,
  FileText as NotesIcon,
  Puzzle,
  Users,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigationItems = [
  { title: "Home", subtitle: "Your daily overview", url: "/home", icon: Home },
  { title: "Inbox", subtitle: "Mentions, replies and updates", url: "/inbox", icon: Inbox },
  { title: "My Work", subtitle: "Tasks assigned to you", url: "/my-work", icon: ListChecks },
  { title: "Agent", subtitle: "Ask the agent about your workspace", url: "/agent", icon: Bot },
  { title: "Projects", subtitle: "Every project in this workspace", url: "/projects", icon: FolderOpen },
  { title: "Pages", subtitle: "Docs and notes", url: "/pages", icon: NotesIcon },
  { title: "Integrations", subtitle: "Connect GitHub, Linear, Notion…", url: "?settings=integrations", icon: Puzzle },
  { title: "Members", subtitle: "Workspace members and roles", url: "?settings=members", icon: Users },
]

export function SearchCommand() {
  const router = useRouter()
  const pathname = usePathname()
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
    router.push(url.startsWith("?") ? `${pathname}${url}` : url)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 w-full justify-start gap-2 rounded-md border-border bg-card py-2 pr-2 pl-1.5 font-normal text-muted-foreground shadow-none hover:bg-card"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-sm leading-5">Search</span>
        <span className="flex items-center gap-0.5">
          {["⌘", "K"].map((key) => (
            <kbd
              key={key}
              className="flex size-4 items-center justify-center rounded bg-muted px-1 font-sans text-[10px] font-medium leading-4 text-foreground/70"
            >
              {key}
            </kbd>
          ))}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "top-[18%] max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-xl p-0 shadow-2xl",
            "data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4"
          )}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command shouldFilter className="[&_[cmdk-group-heading]]:px-4">
            <div className="flex items-center gap-2.5 border-b px-4">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <CommandPrimitive.Input
                autoFocus
                placeholder="Search tasks, docs, projects — or ask the agent..."
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>
            <CommandList className="max-h-[420px] p-2">
              <CommandEmpty className="py-10 text-sm text-muted-foreground">
                No results found.
              </CommandEmpty>
              <CommandGroup heading="Go to">
                {navigationItems.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                    className="items-center gap-3 rounded-lg py-2.5"
                  >
                    <item.icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">Page</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
