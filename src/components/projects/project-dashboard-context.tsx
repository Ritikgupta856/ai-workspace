"use client"

import * as React from "react"

import type { ProjectTeamMember } from "@/components/projects/project-card"
import type { ActivityDTO } from "@/lib/activity"
import type { ProjectStatus } from "@/lib/projects"

/* ── Shape of GET /api/projects/[id]/dashboard ── */

export interface ProjectDetailsData {
  id: string
  name: string
  description: string
  icon: string
  status: ProjectStatus
  progress: number
  taskCount: number
  documentCount: number
  chatCount: number
  integrationCount: number
  members: (ProjectTeamMember & { role?: string; online?: boolean })[]
  createdAt?: string
  updatedAt: string
}

export interface StatsData {
  tasks: { total: number; weeklyChange: number; trend: number[] }
  documents: { total: number; newThisWeek: number }
  chats: { total: number; weeklyIncrease: number }
  integrations: { total: number; connected: number; disconnected: number }
}

export interface HealthData {
  activeTasks: number
  completedThisWeek: number
  overdueTasks: number
  unassignedTasks: number
  documentsUpdated: number
  score: "excellent" | "good" | "needsAttention" | "atRisk"
}

export interface DocumentItem {
  id: string
  name: string
  contentType: string
  updatedAt: string
}

export interface DeadlineData {
  id: string
  taskName: string
  dueDate: string
  dueDateLabel: string
  priority: string
}

export interface TeamMemberData {
  id: string
  name: string
  email: string
  image?: string | null
  role: string
  online: boolean
}

export interface IntegrationItemData {
  id: string
  name: string
  type: string
  status: string
  connected: boolean
}

export interface ProjectDashboardResponse {
  success: boolean
  error?: string
  project: ProjectDetailsData
  stats: StatsData
  health: HealthData
  recentActivity: ActivityDTO[]
  latestDocuments: DocumentItem[]
  upcomingDeadlines: DeadlineData[]
  teamMembers: TeamMemberData[]
  integrations: IntegrationItemData[]
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
