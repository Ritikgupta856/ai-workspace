"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowUpDown,
  Filter,
  LayoutDashboard,
  LayoutGrid,
  LayoutPanelTop,
  List,
  Plus,
  Search,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { requestSidebarRefresh } from "@/lib/sidebar-events"

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
import { CardGridSkeleton, TableSkeleton } from "@/components/dashboard/loading-states"
import {
  HeaderPrimaryButton,
  HeaderSearchButton,
  SectionHeader,
} from "@/components/dashboard/section-header"
import { ViewToggle } from "@/components/common/view-toggle"
import { ToolbarSelect } from "@/components/common/toolbar-select"
import { ProjectGrid } from "@/components/projects/project-grid"
import {
  ProjectGroupedList,
  groupAllProjects,
  groupProjectsByStatus,
  type ProjectRowActions,
} from "@/components/projects/project-rows"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import type { ProjectStatus } from "@/lib/projects"
import { cn } from "@/lib/utils"
import { fetchProjects, createProject, updateProject, deleteProject } from "@/lib/api/projects"

type ViewMode = "list" | "grid"
type GroupBy = "status" | "none"
type SortBy = "updated" | "name" | "progress"
type StatusFilter = "all" | ProjectStatus

const VIEW_TABS: { value: ViewMode; label: string; icon: LucideIcon }[] = [
  { value: "list", label: "List", icon: List },
  { value: "grid", label: "Grid", icon: LayoutGrid },
]

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "none", label: "None" },
]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "name", label: "Name A–Z" },
  { value: "progress", label: "Progress" },
]

// "Filter by Status" until one is chosen, then "Filter by Active" etc.
const STATUS_OPTIONS: { value: StatusFilter; label: string; pill: string }[] = [
  { value: "all", label: "All (except archived)", pill: "Status" },
  ...(Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((s) => ({
    value: s,
    label: PROJECT_STATUS_CONFIG[s].label,
    pill: PROJECT_STATUS_CONFIG[s].label,
  })),
]

export default function ProjectsPage() {
  const router = useRouter()
  const slug = useParams().slug as string
  const [projectList, setProjectList] = React.useState<ProjectCardData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [search, setSearch] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [groupBy, setGroupBy] = React.useState<GroupBy>("status")
  const [sortBy, setSortBy] = React.useState<SortBy>("updated")
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<ProjectCardData | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<ProjectCardData | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetchProjects()
      .then((projects) => {
        if (cancelled) return
        setProjectList(projects)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load projects")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  const filtered = React.useMemo(() => {
    let result = [...projectList]

    if (statusFilter === "all") {
      // Archived projects stay out of the default view — they're one status
      // filter away, but mixing them in makes the list noisy over time.
      result = result.filter((p) => p.status !== "ARCHIVED")
    } else {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      )
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "progress":
        result.sort((a, b) => b.progress - a.progress)
        break
      default:
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }

    return result
  }, [projectList, search, statusFilter, sortBy])

  const groups = React.useMemo(
    () => (groupBy === "status" ? groupProjectsByStatus(filtered) : groupAllProjects(filtered)),
    [filtered, groupBy]
  )

  /* ── Actions ────────────────────────────────────────────── */

  function openCreate() {
    setEditingProject(null)
    setDialogOpen(true)
  }

  const handleView = React.useCallback((id: string) => router.push(`/${slug}/projects/${id}/overview`), [router, slug])

  const handleOpenEdit = React.useCallback(
    (id: string) => {
      const project = projectList.find((p) => p.id === id)
      if (!project) return
      setEditingProject(project)
      setDialogOpen(true)
    },
    [projectList]
  )

  const handleStatusChange = React.useCallback(
    async (id: string, status: ProjectStatus) => {
      const previous = projectList
      setProjectList((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      try {
        const updated = await updateProject(id, { status })
        setProjectList((prev) => prev.map((p) => (p.id === id ? updated : p)))
        toast.success(
          status === "ARCHIVED" ? "Project archived" : `Status set to ${PROJECT_STATUS_CONFIG[status].label}`
        )
      } catch (err) {
        setProjectList(previous)
        toast.error(err instanceof Error ? err.message : "Failed to update")
      }
    },
    [projectList]
  )

  const handleDuplicate = React.useCallback(
    async (id: string) => {
      const project = projectList.find((p) => p.id === id)
      if (!project) return
      try {
        const created = await createProject({
          name: `${project.name} (Copy)`,
          description: project.description,
          status: project.status,
          icon: project.icon,
        })
        setProjectList((prev) => [created, ...prev])
        requestSidebarRefresh()
        toast.success("Project duplicated")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate")
      }
    },
    [projectList]
  )

  const handleRequestDelete = React.useCallback(
    (id: string) => {
      const project = projectList.find((p) => p.id === id)
      if (project) setPendingDelete(project)
    },
    [projectList]
  )

  async function confirmDelete() {
    const project = pendingDelete
    if (!project) return
    setPendingDelete(null)
    const previous = projectList
    setProjectList((prev) => prev.filter((p) => p.id !== project.id))
    try {
      await deleteProject(project.id)
      requestSidebarRefresh()
      toast.success(`Deleted "${project.name}"`)
    } catch (err) {
      setProjectList(previous)
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  function handleDialogSuccess(project: ProjectCardData) {
    setProjectList((prev) => {
      const exists = prev.some((p) => p.id === project.id)
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev]
    })
    setEditingProject(null)
  }

  const rowActions: ProjectRowActions = {
    onView: handleView,
    onEdit: handleOpenEdit,
    onDuplicate: handleDuplicate,
    onStatusChange: handleStatusChange,
    onDelete: handleRequestDelete,
  }

  /* ── Render ─────────────────────────────────────────────── */

  const hasFilters = search.trim() !== "" || statusFilter !== "all"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader icon={LayoutPanelTop} title="Projects" count={projectList.length}>
        <ViewToggle className="hidden sm:flex" value={viewMode} options={VIEW_TABS} onChange={setViewMode} />
        <HeaderSearchButton onClick={() => setSearchOpen(true)} />
        <HeaderPrimaryButton onClick={openCreate}>Add</HeaderPrimaryButton>
      </SectionHeader>

      {/* Toolbar */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <div className="flex items-center gap-1.5">
          {VIEW_TABS.map((tab) => {
            const active = viewMode === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setViewMode(tab.value)}
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
          {viewMode === "list" && (
            <ToolbarSelect icon={LayoutDashboard} prefix="Group by" value={groupBy} options={GROUP_OPTIONS} onChange={setGroupBy} />
          )}
          <ToolbarSelect icon={ArrowUpDown} prefix="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          <ToolbarSelect icon={Filter} prefix="Filter by" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />

          {searchOpen ? (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
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
              aria-label="Search projects"
            >
              <Search className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-8">
        {loading ? (
          viewMode === "grid" ? <CardGridSkeleton /> : <TableSkeleton rows={6} />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
            <LayoutPanelTop className="mb-1 size-7 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? "No projects match these filters" : "No projects yet"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {hasFilters ? "Try a different search or status." : "Create a project to organise tasks, pages and boards."}
            </p>
            {hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 rounded-lg text-[13px]"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={openCreate} className="mt-3 h-8 gap-1.5 rounded-lg text-[13px]">
                <Plus className="size-3.5" />
                New project
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <ProjectGrid
            projects={filtered}
            onView={handleView}
            onEdit={handleOpenEdit}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
            onDelete={handleRequestDelete}
          />
        ) : (
          <ProjectGroupedList groups={groups} actions={rowActions} />
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingProject(null)
        }}
        mode={editingProject ? "edit" : "create"}
        project={editingProject ?? undefined}
        onSuccess={handleDialogSuccess}
      />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              &ldquo;{pendingDelete?.name}&rdquo; and its {pendingDelete?.taskCount ?? 0} tasks will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
