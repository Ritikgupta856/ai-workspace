"use client"

import { TasksView } from "@/components/tasks/tasks-view"
import { ProjectSectionHeading } from "@/components/projects/project-section-heading"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectTasksPage() {
  const { projectId } = useProjectDashboard()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjectSectionHeading title="Tasks" />
      <TasksView projectId={projectId} showPageHeader={false} />
    </div>
  )
}
