"use client"

import { ProjectPagesTab } from "@/components/projects/project-tabs"
import { ProjectSectionHeading } from "@/components/projects/project-section-heading"
import { NewPageButton } from "@/components/pages/pages-list"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectPagesPage() {
  const { projectId } = useProjectDashboard()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <ProjectSectionHeading title="Pages" />
        <NewPageButton projectId={projectId} onCreated={() => {}} />
      </div>
      <ProjectPagesTab projectId={projectId} />
    </div>
  )
}
