"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { requestSidebarRefresh } from "@/lib/sidebar-events"

import {
  Archive,
  ArchiveRestore,
  Clock,
  Copy,
  FileText,
  ListTree,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Puzzle,
  Trash2,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToolbarSelect } from "@/components/common/toolbar-select"
import { FavoriteButton } from "@/components/common/favorite-button"
import { HeaderButton } from "@/components/dashboard/section-header"
import { ProjectSectionHeader } from "@/components/projects/project-section-header"
import {
  ActivityRows,
  DocumentRows,
  HealthRows,
  MemberRows,
  OVERVIEW_ICONS,
  OverviewSection,
  healthScorePill,
} from "@/components/projects/project-overview-sections"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { ManageProjectMembersDialog } from "@/components/projects/manage-members-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { createProject, deleteProject, updateProject } from "@/lib/api/projects"

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((s) => ({
  value: s,
  label: PROJECT_STATUS_CONFIG[s].label,
}))
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectOverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const slug = params.slug as string
  const { projectId, data, setData, reload } = useProjectDashboard()

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [manageMembersOpen, setManageMembersOpen] = React.useState(false)

  // "Manage" in the Members section links to ?settings=members so it's a
  // real, shareable URL rather than a dead button; this picks that up.
  React.useEffect(() => {
    if (searchParams.get("settings") !== "members") return
    setManageMembersOpen(true)
    const params = new URLSearchParams(searchParams)
    params.delete("settings")
    const rest = params.toString()
    router.replace(`/${slug}/projects/${projectId}/overview${rest ? `?${rest}` : ""}`)
  }, [searchParams, router, projectId, slug])

  async function handleStatusChange(status: ProjectStatus) {
    const previous = data.project
    setData({ ...data, project: { ...previous, status } })
    try {
      await updateProject(projectId, { status })
      toast.success(status === "ARCHIVED" ? "Project archived" : "Status updated")
    } catch (err) {
      setData((prev) => (prev ? { ...prev, project: previous } : prev))
      toast.error(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleDuplicate() {
    try {
      const copy = await createProject({
        name: `${data.project.name} (Copy)`,
        description: data.project.description,
        status: data.project.status,
        icon: data.project.icon,
      })
      requestSidebarRefresh()
      toast.success("Project duplicated")
      router.push(`/${slug}/projects/${copy.id}/overview`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(projectId)
      requestSidebarRefresh()
      toast.success("Project deleted")
      router.push(`/${slug}/projects`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
      setDeleting(false)
    }
  }

  function handleEditSuccess(updated: ProjectCardData) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            project: {
              ...prev.project,
              name: updated.name,
              description: updated.description,
              status: updated.status,
              icon: updated.icon,
              updatedAt: updated.updatedAt,
            },
          }
        : prev
    )
  }

  const project = data.project
  const isArchived = project.status === "ARCHIVED"
  const score = healthScorePill(data.health.score)

  const stats = [
    { icon: ListTree, value: project.taskCount, label: "tasks" },
    { icon: FileText, value: project.documentCount, label: "docs" },
    { icon: MessageSquare, value: project.chatCount, label: "chats" },
    { icon: Puzzle, value: project.integrationCount, label: "integrations" },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectSectionHeader
        section="overview"
        projectId={projectId}
        projectName={project.name}
        projectIcon={project.icon}
        members={project.members}
      >
        <HeaderButton icon={UserPlus} onClick={() => setManageMembersOpen(true)}>
          Add member
        </HeaderButton>
        <FavoriteButton entityType="PROJECT" entityId={project.id} className="size-8 rounded-lg border-border/80 shadow-none" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8 rounded-lg border-border/80 shadow-none"
              aria-label="Project actions"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <PenLine className="size-4" />
              Edit project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange(isArchived ? "ACTIVE" : "ARCHIVED")}>
              {isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              {isArchived ? "Restore" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ProjectSectionHeader>

      {/* Toolbar: status control + counts on the left, progress + freshness on the right */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <ToolbarSelect
          icon={PROJECT_STATUS_CONFIG[project.status].icon}
          prefix="Status"
          value={project.status}
          options={STATUS_OPTIONS}
          onChange={handleStatusChange}
        />
        <div className="hidden items-center gap-4 sm:flex">
          {stats.map(({ icon: Icon, value, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Icon className="size-3.5" />
              <span className="font-medium text-foreground tabular-nums">{value}</span> {label}
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
            Progress
            <Progress value={project.progress} className="h-1.5 w-24" />
            <span className="font-medium text-foreground tabular-nums">{project.progress}%</span>
          </span>
          <span className="hidden items-center gap-1.5 text-[13px] text-muted-foreground md:inline-flex">
            <Clock className="size-3.5" />
            Updated {formatUpdatedDate(project.updatedAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 px-5 pt-5 pb-8">
        {project.description && (
          <p className="max-w-3xl text-[13px] leading-5 text-muted-foreground">{project.description}</p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <OverviewSection
              icon={OVERVIEW_ICONS.activity}
              title="Recent activity"
              count={data.recentActivity.length}
            >
              <ActivityRows items={data.recentActivity} />
            </OverviewSection>

            <OverviewSection
              icon={OVERVIEW_ICONS.documents}
              title="Latest documents"
              count={data.latestDocuments.length}
              action={{ label: "All pages", href: `/${slug}/projects/${projectId}/pages` }}
            >
              <DocumentRows items={data.latestDocuments} />
            </OverviewSection>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex flex-col">
              <div className="flex h-10 items-center justify-between rounded-lg bg-muted/60 px-4 dark:bg-muted/40">
                <div className="flex items-center gap-2">
                  <OVERVIEW_ICONS.health className="size-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs font-medium text-foreground">Project health</span>
                </div>
                <span className={cn("inline-flex h-4.5 items-center rounded px-1.5 text-[11px] font-medium leading-none", score.className)}>
                  {score.label}
                </span>
              </div>
              <div className="flex flex-col pt-1">
                <HealthRows health={data.health} />
              </div>
            </section>

            <OverviewSection
              icon={OVERVIEW_ICONS.members}
              title="Members"
              count={data.teamMembers.length}
              action={{ label: "Manage", href: "?settings=members" }}
            >
              <MemberRows members={data.teamMembers} />
            </OverviewSection>
          </div>
        </div>
      </div>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        project={
          {
            ...data.project,
            progress: data.project.progress,
            doneTaskCount: 0,
            members: data.project.members,
            createdAt: data.project.createdAt ?? data.project.updatedAt,
          } as ProjectCardData
        }
        onSuccess={handleEditSuccess}
      />

      <ManageProjectMembersDialog
        projectId={projectId}
        open={manageMembersOpen}
        onOpenChange={setManageMembersOpen}
        members={data.teamMembers}
        onChanged={reload}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {data.project.name}?</DialogTitle>
            <DialogDescription>
              This removes the project and its {data.project.taskCount} tasks.
              Documents and chats are kept but detached. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Spinner className="size-4" />}
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
