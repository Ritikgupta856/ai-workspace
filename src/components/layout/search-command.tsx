"use client"

import * as React from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import {
  Search,
  Sparkles,
  Inbox,
  ListChecks,
  Bot,
  FolderOpen,
  FileText as NotesIcon,
  Puzzle,
  Users,
  CircleCheck,
  Frame,
  MessageSquare,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SearchResult, SearchResultType } from "@/lib/search"

const navigationItems = [
  { title: "Inbox", subtitle: "Mentions, replies and updates", url: "/inbox", icon: Inbox },
  { title: "My Work", subtitle: "Tasks assigned to you", url: "/my-work", icon: ListChecks },
  { title: "Agent", subtitle: "Ask the agent about your workspace", url: "/agent", icon: Bot },
  { title: "Projects", subtitle: "Every project in this workspace", url: "/projects", icon: FolderOpen },
  { title: "Integrations", subtitle: "Connect GitHub, Linear, Notion…", url: "?settings=integrations", icon: Puzzle },
  { title: "Members", subtitle: "Workspace members and roles", url: "?settings=members", icon: Users },
]

// Render order of the result groups; the API returns them flat.
const resultGroups: { type: SearchResultType; heading: string; label: string; icon: LucideIcon }[] = [
  { type: "task", heading: "Tasks", label: "Task", icon: CircleCheck },
  { type: "project", heading: "Projects", label: "Project", icon: FolderOpen },
  { type: "page", heading: "Pages", label: "Page", icon: NotesIcon },
  { type: "board", heading: "Boards", label: "Board", icon: Frame },
  { type: "chat", heading: "Chats", label: "Chat", icon: MessageSquare },
  { type: "member", heading: "Members", label: "Member", icon: Users },
]

const ASK_AGENT = "ask-agent"
const SEARCH_DEBOUNCE_MS = 200

const itemClass = "items-center gap-3 rounded-lg py-2.5"

export function SearchCommand() {
  const router = useRouter()
  const pathname = usePathname()
  const slug = useParams().slug as string
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  // Results are tagged with the query they answer, so "loading" is simply a
  // mismatch and stale results stay on screen until fresh ones land.
  const [fetched, setFetched] = React.useState<{ query: string; results: SearchResult[] }>({
    query: "",
    results: [],
  })
  const [selected, setSelected] = React.useState("")

  const q = query.trim()
  const results = q ? fetched.results : []
  const loading = q !== "" && fetched.query !== q

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery("")
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!q) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data: { results?: SearchResult[] }) => {
          setFetched({ query: q, results: data.results ?? [] })
          setSelected("")
        })
        .catch((err: Error) => {
          if (err.name !== "AbortError") setFetched({ query: q, results: [] })
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  const groups = resultGroups
    .map((group) => ({ ...group, items: results.filter((r) => r.type === group.type) }))
    .filter((group) => group.items.length > 0)
  const navMatches = q
    ? navigationItems.filter((item) => item.title.toLowerCase().includes(q.toLowerCase()))
    : navigationItems

  // cmdk only auto-highlights when an item mounts, so pin the highlight to the
  // first visible row whenever the current one is gone (new query or results).
  const visibleValues = [
    ...groups.flatMap((group) => group.items.map((r) => `${r.type}:${r.id}`)),
    ...navMatches.map((item) => `nav:${item.url}`),
    ...(q ? [ASK_AGENT] : []),
  ]
  const activeValue = visibleValues.includes(selected) ? selected : (visibleValues[0] ?? "")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    setQuery("")
  }

  function handleSelect(url: string) {
    handleOpenChange(false)
    router.push(url.startsWith("?") ? `${pathname}${url}` : `/${slug}${url}`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "top-[18%] max-w-2xl translate-y-0 gap-0 overflow-hidden rounded-xl p-0 shadow-2xl",
            "data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4"
          )}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command
            shouldFilter={false}
            value={activeValue}
            onValueChange={setSelected}
            className="[&_[cmdk-group-heading]]:px-4"
          >
            <div className="flex items-center gap-2.5 border-b px-4">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <CommandPrimitive.Input
                autoFocus
                value={query}
                onValueChange={(value) => {
                  setQuery(value)
                  setSelected("")
                }}
                placeholder="Search tasks, docs, projects — or ask the agent..."
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading && <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />}
              <kbd className="shrink-0 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>
            <CommandList className="max-h-[420px] p-2">
              {q && !loading && results.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No tasks, projects or pages match &ldquo;{q}&rdquo;.
                </p>
              )}

              {groups.map((group) => (
                <CommandGroup key={group.type} heading={group.heading}>
                  {group.items.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${result.type}:${result.id}`}
                      onSelect={() => handleSelect(result.href)}
                      className={itemClass}
                    >
                      {result.emoji ? (
                        <span className="flex size-4 shrink-0 items-center justify-center text-sm leading-none">
                          {result.emoji}
                        </span>
                      ) : (
                        <group.icon className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                        {result.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{group.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              {navMatches.length > 0 && (
                <CommandGroup heading="Go to">
                  {navMatches.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={`nav:${item.url}`}
                      onSelect={() => handleSelect(item.url)}
                      className={itemClass}
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
              )}

              {q && (
                <CommandGroup heading="Agent">
                  <CommandItem
                    value={ASK_AGENT}
                    onSelect={() => handleSelect(`/agent?q=${encodeURIComponent(q)}`)}
                    className={itemClass}
                  >
                    <Sparkles className="size-4 shrink-0 text-primary" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      Ask the agent about &ldquo;{q}&rdquo;
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">Agent</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
