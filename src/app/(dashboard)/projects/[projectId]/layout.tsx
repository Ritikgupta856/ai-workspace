"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DetailPageSkeleton } from "@/components/dashboard/loading-states"
import {
  ProjectDashboardProvider,
  type ProjectDashboardResponse,
} from "@/components/projects/project-dashboard-context"

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params.projectId as string

  const [data, setData] = React.useState<ProjectDashboardResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadDashboard = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/dashboard`)
      const json: ProjectDashboardResponse = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to load project")
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [projectId, setData])

  React.useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="p-6">
        <DetailPageSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 py-20">
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
    <div className="flex flex-1 flex-col gap-5 p-6">
      <ProjectDashboardProvider projectId={projectId} data={data} reload={loadDashboard} setData={setData}>
        {children}
      </ProjectDashboardProvider>
    </div>
  )
}
