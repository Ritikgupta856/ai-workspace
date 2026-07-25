"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ProjectDetailsHeader,
  type ProjectDetailsData,
} from "@/components/projects/project-details-header"
import {
  ProjectOverview,
  type OverviewData,
} from "@/components/projects/project-overview"
import {
  ProjectActivityTab,
  ProjectDocumentsTab,
  ProjectIntegrationsTab,
  ProjectKnowledgeTab,
  ProjectMembersTab,
  ProjectTasksTab,
} from "@/components/projects/project-tabs"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { InviteMemberDialog } from "@/components/members/invite-member-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"
import { createProject, deleteProject, updateProject } from "@/lib/api/projects"

const navTabs = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "documents", label: "Documents" },
  { value: "knowledge", label: "Knowledge" },
  { value: "integrations", label: "Integrations" },
  { value: "members", label: "Members" },
  { value: "activity", label: "Activity" },
] as const

type TabValue = (typeof navTabs)[number]["value"]

interface DashboardResponse {
  success: boolean
  error?: string
  project: ProjectDetailsData
  stats: OverviewData["stats"]
  health: OverviewData["health"]
  recentActivity: OverviewData["recentActivity"]
  latestDocuments: OverviewData["latestDocuments"]
  upcomingDeadlines: OverviewData["upcomingDeadlines"]
  teamMembers: OverviewData["teamMembers"]
  integrations: OverviewData["integrations"]
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [activeTab, setActiveTab] = React.useState<TabValue>("overview")
  const [data, setData] = React.useState<DashboardResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const loadDashboard = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/dashboard`)
      const json: DashboardResponse = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to load project")
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  /* ── Header actions ─────────────────────────────────────── */

  async function handleStatusChange(status: ProjectStatus) {
    if (!data) return
    const previous = data.project
    setData({ ...data, project: { ...previous, status } })
    try {
      await updateProject(projectId, { status })
      toast.success(
        status === "ARCHIVED" ? "Project archived" : "Status updated"
      )
    } catch (err) {
      setData((prev) => (prev ? { ...prev, project: previous } : prev))
      toast.error(err instanceof Error ? err.message : "Failed to update")
    }
  }

  async function handleDuplicate() {
    if (!data) return
    try {
      const copy = await createProject({
        name: `${data.project.name} (Copy)`,
        description: data.project.description,
        status: data.project.status,
        icon: data.project.icon,
      })
      toast.success("Project duplicated")
      router.push(`/projects/${copy.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(projectId)
      toast.success("Project deleted")
      router.push("/projects")
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

  /* ── Render ─────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm font-medium text-destructive">
          {error || "Failed to load project"}
        </p>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ProjectDetailsHeader
        project={data.project}
        onInvite={() => setInviteOpen(true)}
        onEdit={() => setEditOpen(true)}
        onDuplicate={handleDuplicate}
        onStatusChange={handleStatusChange}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* Plain buttons rather than Radix Tabs: the panels mount their own data
          fetches, and only the active one should ever run. */}
      <div
        role="tablist"
        aria-label="Project sections"
        className="flex items-center gap-0 overflow-x-auto border-b"
      >
        {navTabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <ProjectOverview
          data={{
            stats: data.stats,
            health: data.health,
            recentActivity: data.recentActivity,
            latestDocuments: data.latestDocuments,
            upcomingDeadlines: data.upcomingDeadlines,
            teamMembers: data.teamMembers,
            integrations: data.integrations,
          }}
          projectId={projectId}
        />
      )}
      {activeTab === "tasks" && <ProjectTasksTab projectId={projectId} />}
      {activeTab === "documents" && (
        <ProjectDocumentsTab projectId={projectId} />
      )}
      {activeTab === "knowledge" && (
        <ProjectKnowledgeTab projectId={projectId} />
      )}
      {activeTab === "integrations" && (
        <ProjectIntegrationsTab integrations={data.integrations} />
      )}
      {activeTab === "members" && <ProjectMembersTab projectId={projectId} />}
      {activeTab === "activity" && <ProjectActivityTab projectId={projectId} />}

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

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

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
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Spinner className="size-4" />}
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
