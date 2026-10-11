"use client"

import * as React from "react"

import {
  ProjectDashboardProvider,
  type ProjectDashboardResponse,
} from "@/components/projects/project-dashboard-context"
import { useProjectDashboard } from "@/lib/query/projects"

/**
 * Holds the project's dashboard on the client so pages can update it
 * optimistically (status, edits) and reload it after mutations. First paint
 * comes from the server layout, which seeds the cache, so there's no loading
 * state here.
 */
export function ProjectDashboardShell({
  projectId,
  initialData,
  children,
}: {
  projectId: string
  initialData: ProjectDashboardResponse
  children: React.ReactNode
}) {
  const { data, setData, reload } = useProjectDashboard(projectId, initialData)

  return (
    <ProjectDashboardProvider projectId={projectId} data={data} reload={reload} setData={setData}>
      {children}
    </ProjectDashboardProvider>
  )
}
