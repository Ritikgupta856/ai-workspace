"use client"

import { TasksView } from "@/components/tasks/tasks-view"
import { ProjectSectionHeader } from "@/components/projects/project-section-header"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectTasksPage() {
  const { projectId, data } = useProjectDashboard()

  return (
    <TasksView
      projectId={projectId}
      showPageHeader={false}
      header={(controls) => (
        <ProjectSectionHeader
          section="tasks"
          projectId={projectId}
          projectName={data.project.name}
          projectIcon={data.project.icon}
          members={data.project.members}
          action={{ label: "Add", onClick: controls.openCreate }}
        />
      )}
    />
  )
}
