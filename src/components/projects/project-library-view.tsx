"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ToolbarSelect } from "@/components/common/toolbar-select"
import { TableSkeleton } from "@/components/dashboard/loading-states"
import {
  ProjectSectionHeader,
  type ProjectSectionTab,
} from "@/components/projects/project-section-header"
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

  const [items, setItems] = React.useState<LibraryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<ViewMode>("list")
  const [sortBy, setSortBy] = React.useState<SortBy>("updated")
  const [search, setSearch] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<LibraryItem | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const [reloadKey, setReloadKey] = React.useState(0)

  // State only changes once the request settles; the initial `loading: true`
  // covers the first fetch and `retry` resets it before bumping the key.
  React.useEffect(() => {
    let cancelled = false
    load()
      .then((list) => {
        if (cancelled) return
        setItems(list)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // `load` closes over projectId only; callers pass a fresh arrow per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, reloadKey])

  function retry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
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
      router.push(await create())
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
      setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id))
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectSectionHeader
        section={section}
        projectId={projectId}
        projectName={data.project.name}
        projectIcon={data.project.icon}
        members={data.project.members}
        viewToggle={{ value: view, options: VIEW_TABS, onChange: setView }}
        onSearch={() => setSearchOpen(true)}
        action={{ label: "Add", onClick: handleCreate, loading: creating }}
      />

      {/* Toolbar */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <div className="flex items-center gap-1.5">
          {VIEW_TABS.map((tab) => {
            const active = view === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors",
                  active
                    ? "border border-border/80 bg-card font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ToolbarSelect icon={ArrowUpDown} prefix="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />

          {searchOpen ? (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${noun}s...`}
                className="h-8 w-48 rounded-lg border-border/80 pr-7 pl-7 text-[13px] shadow-none"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearch("")
                    setSearchOpen(false)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setSearchOpen(false)
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8 rounded-lg border-border/80 shadow-none"
              onClick={() => setSearchOpen(true)}
              aria-label={`Search ${noun}s`}
            >
              <Search className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-8">
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
            {!search && (
              <Button size="sm" onClick={handleCreate} disabled={creating} className="mt-3 h-8 gap-1.5 rounded-lg text-[13px]">
                <Plus className="size-3.5" />
                New {noun}
              </Button>
            )}
          </div>
        ) : view === "list" ? (
          <div className="flex flex-col">
            {/* Column header */}
            <div className="grid h-8 grid-cols-[minmax(0,1fr)_150px_140px_32px] items-center px-4 text-[13px] text-muted-foreground max-sm:grid-cols-[minmax(0,1fr)_32px]">
              <span>Name</span>
              <span className="max-sm:hidden">Created by</span>
              <span className="max-sm:hidden">Updated</span>
              <span />
            </div>
            {visible.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group grid h-11 grid-cols-[minmax(0,1fr)_150px_140px_32px] items-center rounded-lg border border-transparent px-4 transition-colors hover:border-border hover:bg-muted/40 max-sm:grid-cols-[minmax(0,1fr)_32px]"
              >
                <span className="flex min-w-0 items-center gap-3 pr-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    {renderIcon(item)}
                  </span>
                  <span className="truncate text-sm font-medium leading-5 text-foreground">{item.title}</span>
                </span>
                <span className="truncate text-[13px] text-foreground/80 max-sm:hidden">{item.author ?? "—"}</span>
                <span className="text-[13px] text-muted-foreground max-sm:hidden">
                  {formatUpdatedDate(item.updatedAt)}
                </span>
                <span className="flex justify-end">{rowMenu(item)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex h-24 flex-col justify-between rounded-lg border border-border/80 bg-card p-4 transition-colors hover:border-border hover:bg-accent/30"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    {renderIcon(item)}
                  </span>
                  {rowMenu(item)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {item.author ? `${item.author} · ` : ""}
                    {formatUpdatedDate(item.updatedAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
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
