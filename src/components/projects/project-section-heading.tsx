"use client"

import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

/** Lightweight "where am I" heading for project sub-pages that don't show the full ProjectDetailsHeader. */
export function ProjectSectionHeading({ title }: { title: string }) {
  const { data } = useProjectDashboard()

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{data.project.name}</p>
    </div>
  )
}
