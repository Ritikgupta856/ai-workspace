"use client"

import * as React from "react"

import type { ProjectDetailsData } from "@/components/projects/project-details-header"
import type { OverviewData } from "@/components/projects/project-overview"

export interface ProjectDashboardResponse {
  success: boolean
  error?: string
  project: ProjectDetailsData
  stats: OverviewData["stats"]
  health: OverviewData["health"]
  recentActivity: OverviewData["recentActivity"]
  latestDocuments: OverviewData["latestDocuments"]
  upcomingDeadlines: OverviewData["upcomingDeadlines"]
  teamMembers: OverviewData["teamMembers"]
  integrations: OverviewData["integrations"]
}

interface ProjectDashboardContextValue {
  projectId: string
  data: ProjectDashboardResponse
  reload: () => void
  setData: React.Dispatch<React.SetStateAction<ProjectDashboardResponse | null>>
}

const ProjectDashboardContext = React.createContext<ProjectDashboardContextValue | null>(null)

export function ProjectDashboardProvider({
  projectId,
  data,
  reload,
  setData,
  children,
}: ProjectDashboardContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ projectId, data, reload, setData }),
    [projectId, data, reload, setData]
  )
  return (
    <ProjectDashboardContext.Provider value={value}>
      {children}
    </ProjectDashboardContext.Provider>
  )
}

/** Every section route reads the project's header/stats data from here instead of re-fetching it. */
export function useProjectDashboard() {
  const ctx = React.useContext(ProjectDashboardContext)
  if (!ctx) {
    throw new Error("useProjectDashboard must be used within a project route")
  }
  return ctx
}
