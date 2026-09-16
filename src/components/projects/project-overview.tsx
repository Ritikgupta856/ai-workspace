"use client"

import type { StatsData } from "@/components/projects/summary-cards"
import { RecentActivity, type ActivityItemData } from "@/components/projects/recent-activity"
import { ProjectHealth, type HealthData } from "@/components/projects/project-health"
import { LatestDocuments, type DocumentItem } from "@/components/projects/latest-documents"
import { ProjectMembersSidebar, type TeamMemberData } from "@/components/projects/project-members-sidebar"
import type { DeadlineData } from "@/components/projects/upcoming-deadlines"
import type { IntegrationItemData } from "@/components/projects/project-integrations-sidebar"

export interface OverviewData {
  stats: StatsData
  health: HealthData
  recentActivity: ActivityItemData[]
  latestDocuments: DocumentItem[]
  upcomingDeadlines: DeadlineData[]
  teamMembers: TeamMemberData[]
  integrations: IntegrationItemData[]
}

interface ProjectOverviewProps {
  data: OverviewData
  projectId: string
}

export function ProjectOverview({ data }: ProjectOverviewProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Column */}
      <div className="flex-1 space-y-6 lg:w-[70%]">
        <RecentActivity activities={data.recentActivity} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProjectHealth health={data.health} />
          <LatestDocuments documents={data.latestDocuments} />
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6 lg:w-[30%] lg:min-w-[300px]">
        <ProjectMembersSidebar members={data.teamMembers} />
      </div>
    </div>
  )
}
