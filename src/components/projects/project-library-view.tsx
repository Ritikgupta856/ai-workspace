"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query/keys"
import { useInvalidateSidebar } from "@/lib/query/sidebar"
import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/common/theme-menu"
import { SearchCommand } from "@/components/layout/search-command"
import { PersonAvatar } from "@/components/tasks/task-grouped-list"
import { ToolbarSelect } from "@/components/common/toolbar-select"
import { TableSkeleton } from "@/components/dashboard/loading-states"
import type { ProjectSectionTab } from "@/components/projects/project-section-header"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────── */

export interface LibraryItem {
  id: string
  title: string
  href: string
  /** Emoji string or an icon element; falls back to `fallbackIcon`. */
  icon?: React.ReactNode
  author?: string | null
  updatedAt: string
  createdAt?: string
}

type ViewMode = "list" | "grid"
type SortBy = "updated" | "title" | "created"

const VIEW_TABS: { value: ViewMode; label: string; icon: LucideIcon }[] = [
  { value: "list", label: "List", icon: List },
  { value: "grid", label: "Grid", icon: LayoutGrid },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "title", label: "Title A–Z" },
  { value: "created", label: "Newest first" },
]

const NO_ITEMS: LibraryItem[] = []

export interface ProjectLibraryViewProps {
  section: Extract<ProjectSectionTab, "pages" | "board">
  /** Singular noun for copy: "page", "board". */
  noun: string
  fallbackIcon: LucideIcon
  load: () => Promise<LibraryItem[]>
  /** Creates a new item and returns where to navigate. */
  create: () => Promise<string>
  remove?: (id: string) => Promise<void>
  emptyTitle: string
  emptyDescription: string
}

/* ── View ───────────────────────────────────────────────────── */

/**
 * Pages and Board share this: the section header, a List/Grid toolbar with
 * sort + search, and dense rows in the same rhythm as the task list.
 */
export function ProjectLibraryView({
  section,
  noun,
  fallbackIcon: FallbackIcon,
  load,
  create,
  remove,
  emptyTitle,
  emptyDescription,
}: ProjectLibraryViewProps) {
  const router = useRouter()
  const { projectId, data } = useProjectDashboard()

  const client = useQueryClient()
  const invalidateSidebar = useInvalidateSidebar()
  const libraryKey = queryKeys.library(section, projectId)
  // Cached per project and section, so flipping between Pages and Board (or
  // back to a project you just left) shows the last list at once.
  const { data: items = NO_ITEMS, isPending: loading, error: loadError, refetch } = useQuery({
    queryKey: libraryKey,
    queryFn: load,
  })
  const error = loadError ? loadError.message || "Something went wrong" : null
  const [view, setView] = React.useState<ViewMode>("list")
  const [sortBy, setSortBy] = React.useState<SortBy>("updated")
  const [search, setSearch] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<LibraryItem | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  function retry() {
    void refetch()
  }

  const visible = React.useMemo(() => {
    let list = items
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.title.toLowerCase().includes(q))
    }
    const sorted = [...list]
    switch (sortBy) {
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case "created":
        return sorted.sort((a, b) => (b.createdAt ?? b.updatedAt).localeCompare(a.createdAt ?? a.updatedAt))
      default:
        return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
  }, [items, search, sortBy])

  async function handleCreate() {
    setCreating(true)
    try {
      const destination = await create()
      client.invalidateQueries({ queryKey: libraryKey })
      invalidateSidebar()
      router.push(destination)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to create ${noun}`)
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete || !remove) return
    setDeleting(true)
    try {
      await remove(pendingDelete.id)
      client.setQueryData<LibraryItem[]>(libraryKey, (prev) => prev?.filter((i) => i.id !== pendingDelete.id))
      invalidateSidebar()
      toast.success(`${noun[0].toUpperCase()}${noun.slice(1)} deleted`)
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${noun}`)
    } finally {
      setDeleting(false)
    }
  }

  const renderIcon = (item: LibraryItem) =>
    typeof item.icon === "string" ? (
      <span className="text-sm leading-none">{item.icon}</span>
    ) : (
      (item.icon ?? <FallbackIcon className="size-3.5 text-muted-foreground" />)
    )

  const rowMenu = (item: LibraryItem) =>
    remove ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${item.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => setPendingDelete(item)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  const title = section === "pages" ? "Pages" : "Whiteboards"
  const slug = useParams().slug as string

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top bar: breadcrumb left, search + theme right */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href={`/${slug}/projects`} className="text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <Link
            href={`/${slug}/projects/${projectId}/overview`}
            className="inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-sm leading-none">{data.project.icon}</span>
            <span className="truncate">{data.project.name}</span>
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-medium text-foreground">{title}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-2.5">
          <SearchCommand variant="header" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Title + view switch + primary action */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-8 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading…" : `${items.length} ${noun}${items.length === 1 ? "" : "s"} in ${data.project.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-muted p-0.5">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setView(tab.value)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors",
                    view === tab.value
                      ? "bg-card font-medium text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-[13px]" onClick={handleCreate} disabled={creating}>
              <Plus className="size-3.5" />
              New {noun}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-6 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${noun}s`}
              aria-label={`Search ${noun}s`}
              className="h-9 w-56 rounded-lg border border-border/80 bg-card pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-64"
            />
          </div>
          <ToolbarSelect icon={ArrowUpDown} prefix="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col px-6 pt-2 pb-10">
          {loading ? (
            <TableSkeleton rows={6} />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
              <FallbackIcon className="mb-1 size-7 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">
                {search ? `No ${noun}s match "${search}"` : emptyTitle}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {search ? "Try a different search." : emptyDescription}
              </p>
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col">
              <div className="grid h-10 grid-cols-[minmax(0,1fr)_170px_140px_40px] items-center gap-x-4 border-b border-border/70 px-3 text-[13px] text-muted-foreground max-sm:grid-cols-[minmax(0,1fr)_40px]">
                <span>Name</span>
                <span className="max-sm:hidden">Created by</span>
                <span className="max-sm:hidden">Updated</span>
                <span />
              </div>
              {visible.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group grid h-12 grid-cols-[minmax(0,1fr)_170px_140px_40px] items-center gap-x-4 border-b border-border/70 px-3 transition-colors hover:bg-muted/40 max-sm:grid-cols-[minmax(0,1fr)_40px]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      {renderIcon(item)}
                    </span>
                    <span className="truncate text-sm font-medium leading-5 text-foreground">{item.title}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2 text-[13px] max-sm:hidden">
                    {item.author ? (
                      <>
                        <PersonAvatar name={item.author} className="size-5.5 shrink-0" />
                        <span className="truncate">{item.author}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="text-[13px] text-muted-foreground max-sm:hidden" suppressHydrationWarning>
                    {formatUpdatedDate(item.updatedAt)}
                  </span>
                  <span className="flex justify-end">{rowMenu(item)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex h-28 flex-col justify-between rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-colors hover:bg-muted/40"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {renderIcon(item)}
                    </span>
                    {rowMenu(item)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block truncate text-[12px] text-muted-foreground" suppressHydrationWarning>
                      {item.author ? `${item.author} · ` : ""}
                      {formatUpdatedDate(item.updatedAt)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{pendingDelete?.title}&rdquo;?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
