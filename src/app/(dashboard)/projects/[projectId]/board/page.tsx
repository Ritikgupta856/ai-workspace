"use client"

import { ProjectBoardTab } from "@/components/projects/project-tabs"
import { ProjectSectionHeading } from "@/components/projects/project-section-heading"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectBoardPage() {
  const { projectId } = useProjectDashboard()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjectSectionHeading title="Board" />
      <ProjectBoardTab projectId={projectId} />
    </div>
  )
}
