"use client"

import * as React from "react"

import {
  ProjectDashboardProvider,
  type ProjectDashboardResponse,
} from "@/components/projects/project-dashboard-context"

/**
 * Holds the project's dashboard data on the client so pages can update it
 * optimistically (status, edits) and reload it after mutations. First paint
 * comes from the server layout, so there's no loading state here.
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
  // Client edits override the server copy; the layout keys this component by
  // projectId, so switching projects starts clean from fresh server data.
  const [override, setOverride] = React.useState<ProjectDashboardResponse | null>(null)
  const data = override ?? initialData

  const setData = React.useCallback<
    React.Dispatch<React.SetStateAction<ProjectDashboardResponse | null>>
  >(
    (action) =>
      setOverride((prev) => (typeof action === "function" ? action(prev ?? initialData) : action)),
    [initialData]
  )

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/dashboard`)
      const json: ProjectDashboardResponse = await res.json()
      if (json.success) setOverride(json)
    } catch {
      // Whatever is on screen stays; the next mutation or navigation refreshes it.
    }
  }, [projectId])

  return (
    <ProjectDashboardProvider projectId={projectId} data={data} reload={reload} setData={setData}>
      {children}
    </ProjectDashboardProvider>
  )
}
