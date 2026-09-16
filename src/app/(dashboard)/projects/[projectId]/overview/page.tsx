"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { ProjectDetailsHeader } from "@/components/projects/project-details-header"
import { ProjectOverview } from "@/components/projects/project-overview"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import { InviteMemberDialog } from "@/components/members/invite-member-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"
import { createProject, deleteProject, updateProject } from "@/lib/api/projects"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectOverviewPage() {
  const router = useRouter()
  const { projectId, data, setData } = useProjectDashboard()

  const [editOpen, setEditOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

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
      toast.success("Project duplicated")
      router.push(`/projects/${copy.id}/overview`)
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

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ProjectDetailsHeader
        project={data.project}
        onInvite={() => setInviteOpen(true)}
        onEdit={() => setEditOpen(true)}
        onDuplicate={handleDuplicate}
        onStatusChange={handleStatusChange}
        onDelete={() => setDeleteOpen(true)}
        onNavigateTab={(tab) => router.push(`/projects/${projectId}/${tab}`)}
      />

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
