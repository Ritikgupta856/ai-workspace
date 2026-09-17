"use client"

import { Columns3, List } from "lucide-react"

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
          viewToggle={{
            value: controls.viewMode,
            options: [
              { value: "kanban", icon: Columns3, label: "Board view" },
              { value: "list", icon: List, label: "List view" },
            ],
            onChange: controls.setViewMode,
          }}
          onSearch={controls.openSearch}
          action={{ label: "Add", onClick: controls.openCreate }}
        />
      )}
    />
  )
}
