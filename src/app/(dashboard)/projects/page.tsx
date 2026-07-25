"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Archive, Clock, FolderKanban, Plus } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectGrid } from "@/components/projects/project-grid"
import {
  ProjectToolbar,
  type ProjectSortKey,
} from "@/components/projects/project-toolbar"
import { ProjectEmptyState } from "@/components/projects/project-empty-state"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import {
  getInitials,
  type ProjectCardData,
} from "@/components/projects/project-card"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import type { ProjectStatus } from "@/lib/projects"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/api/projects"

type ProjectTab = "all" | "active" | "archived"

const tabOptions: {
  value: ProjectTab
  label: string
  icon: typeof FolderKanban
}[] = [
  { value: "all", label: "All", icon: FolderKanban },
  { value: "active", label: "Active", icon: Clock },
  { value: "archived", label: "Archived", icon: Archive },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [projectList, setProjectList] = React.useState<ProjectCardData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [projectTab, setProjectTab] = React.useState<ProjectTab>("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState<ProjectSortKey>("updated")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingProject, setEditingProject] =
    React.useState<ProjectCardData | null>(null)
  const [pendingDelete, setPendingDelete] =
    React.useState<ProjectCardData | null>(null)

  const loadProjects = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProjectList(await fetchProjects())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filtered = React.useMemo(() => {
    let result = [...projectList]

    if (projectTab === "active") {
      result = result.filter((p) => p.status === "ACTIVE")
    } else if (projectTab === "archived") {
      result = result.filter((p) => p.status === "ARCHIVED")
    } else {
      // The "All" tab hides archived projects — they have their own tab, and
      // leaving them mixed in makes the default view noisy over time.
      result = result.filter((p) => p.status !== "ARCHIVED")
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
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
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }

    return result
  }, [projectList, search, projectTab, statusFilter, sortBy])

  /* ── Actions ────────────────────────────────────────────── */

  const handleView = React.useCallback(
    (id: string) => router.push(`/projects/${id}`),
    [router]
  )

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
      setProjectList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      )
      try {
        const updated = await updateProject(id, { status })
        setProjectList((prev) => prev.map((p) => (p.id === id ? updated : p)))
        toast.success(
          status === "ARCHIVED"
            ? "Project archived"
            : `Status set to ${PROJECT_STATUS_CONFIG[status].label}`
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
      toast.success(`Deleted "${project.name}"`)
    } catch (err) {
      setProjectList(previous)
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  function handleDialogSuccess(project: ProjectCardData) {
    setProjectList((prev) => {
      const exists = prev.some((p) => p.id === project.id)
      return exists
        ? prev.map((p) => (p.id === project.id ? project : p))
        : [project, ...prev]
    })
    setEditingProject(null)
  }

  /* ── Table columns ──────────────────────────────────────── */
  // Built inside the component so the handlers are the real ones. This used to
  // rely on module-level mutable `handleViewStatic`/`handleEditStatic`, which
  // captured stale closures and left duplicate/delete unwired in list view.
  const listColumns = React.useMemo<ColumnDef<ProjectCardData>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
              {row.original.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.name}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.description || "No description"}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const config = PROJECT_STATUS_CONFIG[row.original.status]
          const Icon = config.icon
          return (
            <Badge
              variant="secondary"
              className={cn(
                "gap-1 px-2 py-0.5 text-[11px] font-medium",
                config.className
              )}
            >
              <Icon className="size-3" />
              {config.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="h-1.5 w-20" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "taskCount",
        header: "Tasks",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.doneTaskCount}/{row.original.taskCount}
          </span>
        ),
      },
      {
        accessorKey: "members",
        header: "Team",
        cell: ({ row }) => {
          const members = row.original.members
          const visible = members.slice(0, 4)
          const remaining = members.length - visible.length
          return (
            <div className="flex -space-x-2">
              {visible.map((m) => (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="size-7 border-2 border-background">
                      <AvatarImage src={m.image ?? undefined} alt={m.name} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{m.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remaining > 0 && (
                <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
                  +{remaining}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatUpdatedDate(row.original.updatedAt)}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ProjectCardMenu
              projectId={row.original.id}
              status={row.original.status}
              onView={handleView}
              onEdit={handleOpenEdit}
              onDuplicate={handleDuplicate}
              onStatusChange={handleStatusChange}
              onDelete={handleRequestDelete}
            />
          </div>
        ),
      },
    ],
    [
      handleView,
      handleOpenEdit,
      handleDuplicate,
      handleStatusChange,
      handleRequestDelete,
    ]
  )

  /* ── Render ─────────────────────────────────────────────── */

  const counts = React.useMemo(
    () => ({
      all: projectList.filter((p) => p.status !== "ARCHIVED").length,
      active: projectList.filter((p) => p.status === "ACTIVE").length,
      archived: projectList.filter((p) => p.status === "ARCHIVED").length,
    }),
    [projectList]
  )

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Projects"
          description="Organize and manage all your projects in one place."
        />
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search projects..."
            value={search}
            onValueChange={setSearch}
          />
          <Button
            onClick={() => {
              setEditingProject(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" />
            New project
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
          {tabOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setProjectTab(value)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                projectTab === value
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
              <span className="text-xs tabular-nums opacity-60">
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
        <ProjectToolbar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadProjects}>
            Try again
          </Button>
        </div>
      ) : projectList.length === 0 ? (
        <ProjectEmptyState
          onCreate={() => {
            setEditingProject(null)
            setDialogOpen(true)
          }}
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <p className="text-sm font-medium">No projects match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or status.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch("")
              setStatusFilter("all")
              setProjectTab("all")
            }}
          >
            Clear filters
          </Button>
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
        <DataTable columns={listColumns} data={filtered} />
      )}

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

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              &ldquo;{pendingDelete?.name}&rdquo; and its{" "}
              {pendingDelete?.taskCount ?? 0} tasks will be permanently removed.
              This cannot be undone.
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
