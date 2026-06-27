"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  ChevronDown,
  Sparkles,
  LayoutTemplate,
  Upload,
  Copy,
  FileText,
  Star,
  Clock,
  Archive,
  FolderKanban,
} from "lucide-react"
import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectGrid } from "@/components/projects/project-grid"
import { ProjectToolbar, type ProjectSortKey } from "@/components/projects/project-toolbar"
import { ProjectEmptyState } from "@/components/projects/project-empty-state"
import { ProjectCardMenu } from "@/components/projects/project-card-menu"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { PROJECT_STATUS_CONFIG, type ProjectStatusKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import type { ProjectCardData } from "@/components/projects/project-card"

export type ProjectTeamMember = {
  id: string
  name: string
}

type Project = ProjectCardData

type ProjectTab = "all" | "starred" | "archived"

const tabOptions: { value: ProjectTab; label: string; icon: typeof FolderKanban }[] = [
  { value: "all", label: "All Projects", icon: FolderKanban },
  { value: "starred", label: "Starred", icon: Star },
  { value: "archived", label: "Archived", icon: Archive },
]

function FilterTrigger({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

const initialProjects: Project[] = [
  {
    id: "1",
    name: "Synapse",
    description: "AI-first workspace platform with chat, tasks, documents, and integrations.",
    status: "ACTIVE" as ProjectStatusKey,
    progress: 72,
    taskCount: 24,
    documentCount: 12,
    chatCount: 8,
    integrationCount: 3,
    members: [
      { id: "u1", name: "Ritik Gupta" },
      { id: "u2", name: "Priya Sharma" },
      { id: "u3", name: "Arjun Patel" },
      { id: "u4", name: "Meera Singh" },
      { id: "u5", name: "Vikram Reddy" },
    ],
    updatedAt: "2026-06-27T10:30:00",
    favorite: true,
    icon: "🧠",
  },
  {
    id: "2",
    name: "Portfolio",
    description: "Personal portfolio website with project showcase and blog.",
    status: "ACTIVE" as ProjectStatusKey,
    progress: 45,
    taskCount: 14,
    documentCount: 6,
    chatCount: 3,
    integrationCount: 1,
    members: [
      { id: "u1", name: "Ritik Gupta" },
      { id: "u3", name: "Arjun Patel" },
    ],
    updatedAt: "2026-06-26T14:20:00",
    favorite: false,
    icon: "🖥️",
  },
  {
    id: "3",
    name: "BasicX Sports",
    description: "E-commerce platform for sports equipment and apparel.",
    status: "ON_HOLD" as ProjectStatusKey,
    progress: 30,
    taskCount: 8,
    documentCount: 4,
    chatCount: 2,
    integrationCount: 2,
    members: [
      { id: "u2", name: "Priya Sharma" },
      { id: "u4", name: "Meera Singh" },
    ],
    updatedAt: "2026-06-20T09:00:00",
    favorite: false,
    icon: "⚽",
  },
  {
    id: "4",
    name: "Design System",
    description: "Internal UI component library and design tokens for all Synapse products.",
    status: "ACTIVE" as ProjectStatusKey,
    progress: 88,
    taskCount: 32,
    documentCount: 18,
    chatCount: 10,
    integrationCount: 2,
    members: [
      { id: "u1", name: "Ritik Gupta" },
      { id: "u2", name: "Priya Sharma" },
      { id: "u3", name: "Arjun Patel" },
      { id: "u4", name: "Meera Singh" },
    ],
    updatedAt: "2026-06-27T08:15:00",
    favorite: true,
    icon: "🎨",
  },
  {
    id: "5",
    name: "Mobile App",
    description: "React Native mobile client for Synapse with full feature parity.",
    status: "COMPLETED" as ProjectStatusKey,
    progress: 100,
    taskCount: 56,
    documentCount: 14,
    chatCount: 6,
    integrationCount: 0,
    members: [
      { id: "u3", name: "Arjun Patel" },
      { id: "u5", name: "Vikram Reddy" },
    ],
    updatedAt: "2026-06-15T16:30:00",
    favorite: false,
    icon: "📱",
  },
  {
    id: "6",
    name: "Marketing Site",
    description: "Company landing page, blog, and documentation hub.",
    status: "ACTIVE" as ProjectStatusKey,
    progress: 55,
    taskCount: 18,
    documentCount: 9,
    chatCount: 4,
    integrationCount: 1,
    members: [
      { id: "u4", name: "Meera Singh" },
      { id: "u2", name: "Priya Sharma" },
    ],
    updatedAt: "2026-06-25T11:00:00",
    favorite: false,
    icon: "🌐",
  },
  {
    id: "7",
    name: "API Gateway",
    description: "Centralized API gateway with rate limiting, auth, and monitoring.",
    status: "ON_HOLD" as ProjectStatusKey,
    progress: 20,
    taskCount: 10,
    documentCount: 3,
    chatCount: 1,
    integrationCount: 0,
    members: [
      { id: "u5", name: "Vikram Reddy" },
    ],
    updatedAt: "2026-06-10T13:45:00",
    favorite: false,
    icon: "🔌",
  },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const listColumns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const project = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-base">
            {project.icon}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {project.name}
            </span>
            {project.favorite && (
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="line-clamp-2 text-xs text-muted-foreground">
        {row.original.description}
      </span>
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
          className={cn("gap-1 px-2 py-0.5 text-[11px] font-medium", config.className)}
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
        <Progress value={row.original.progress} className="h-2 w-20" />
        <span className="text-xs text-muted-foreground">{row.original.progress}%</span>
      </div>
    ),
  },
  {
    accessorKey: "taskCount",
    header: "Tasks",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.taskCount}</span>
    ),
  },
  {
    accessorKey: "members",
    header: "Team",
    cell: ({ row }) => {
      const members = row.original.members
      const visible = members.slice(0, 4)
      const remaining = members.length - 4
      return (
        <div className="flex -space-x-2">
          {visible.map((m) => (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <Avatar className="size-7 border-2 border-background">
                  <AvatarFallback className="text-[10px]">{getInitials(m.name)}</AvatarFallback>
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
          onView={(id) => handleViewStatic(id)}
          onEdit={(id) => handleEditStatic(id)}
        />
      </div>
    ),
  },
]

// Stable references for the actions column
let handleViewStatic = (_id: string) => {}
let handleEditStatic = (_id: string) => {}

export default function ProjectsPage() {
  const router = useRouter()
  const [projectList] = React.useState<Project[]>(initialProjects)
  const [search, setSearch] = React.useState("")
  const [projectTab, setProjectTab] = React.useState<ProjectTab>("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState<ProjectSortKey>("updated")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingProject, setEditingProject] = React.useState<Project | undefined>()

  const filtered = React.useMemo(() => {
    let result = [...projectList]

    if (projectTab === "starred") {
      result = result.filter((p) => p.favorite)
    } else if (projectTab === "archived") {
      result = result.filter((p) => p.status === "ARCHIVED")
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "progress":
        result.sort((a, b) => b.progress - a.progress)
        break
      case "updated":
      default:
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        break
    }

    return result
  }, [projectList, search, projectTab, statusFilter, sortBy])

  function handleView(id: string) {
    router.push(`/projects/${id}`)
  }

  function handleOpenCreate() {
    setDialogMode("create")
    setEditingProject(undefined)
    setDialogOpen(true)
  }

  function handleOpenEdit(id: string) {
    const project = projectList.find((p) => p.id === id)
    if (!project) return
    setDialogMode("edit")
    setEditingProject(project)
    setDialogOpen(true)
  }

  function handleEditSuccess() {
    // TODO: refresh from API
  }

  handleViewStatic = handleView
  handleEditStatic = handleOpenEdit

  const hasProjects = projectList.length > 0

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeading
          title="Projects"
          description="Organize and manage all your projects in one place."
        />
        <div className="flex items-center gap-4">
          <SearchInput
            placeholder="Search projects..."
            value={search}
            onValueChange={setSearch}
          />
          <DropdownMenu>
            <div className="inline-flex items-center">
              <Button
                onClick={handleOpenCreate}
                className="rounded-r-none shadow-none"
              >
                <Plus className="size-4" />
                <span>New Project</span>
              </Button>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-l-none border-l border-primary-foreground/20 px-2 shadow-none">
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleOpenCreate}>
                <Plus className="size-4" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sparkles className="size-4" />
                Generate with AI
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LayoutTemplate className="size-4" />
                Create from Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="size-4" />
                Import Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="size-4" />
                Duplicate Existing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileText className="size-4" />
                Manage Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
          {tabOptions.map((opt) => {
            const Icon = opt.icon
            return (
              <FilterTrigger
                key={opt.value}
                active={projectTab === opt.value}
                onClick={() => setProjectTab(opt.value)}
              >
                <Icon className="size-4" />
                {opt.label}
              </FilterTrigger>
            )
          })}
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

      {!hasProjects ? (
        <ProjectEmptyState onCreate={handleOpenCreate} />
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          No projects match your search.
        </div>
      ) : viewMode === "grid" ? (
        <ProjectGrid
          projects={filtered}
          onView={handleView}
          onEdit={handleOpenEdit}
        />
      ) : (
        <DataTable columns={listColumns} data={filtered} />
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        project={editingProject}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
