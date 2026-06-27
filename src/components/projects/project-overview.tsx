"use client"

import * as React from "react"
import { SummaryCards } from "@/components/projects/summary-cards"
import { RecentActivity } from "@/components/projects/recent-activity"
import { ProjectHealth } from "@/components/projects/project-health"
import { LatestDocuments } from "@/components/projects/latest-documents"
import { ProjectMembersSidebar } from "@/components/projects/project-members-sidebar"
import { UpcomingDeadlines } from "@/components/projects/upcoming-deadlines"
import { ProjectIntegrationsSidebar } from "@/components/projects/project-integrations-sidebar"

export function ProjectOverview() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6 lg:w-[70%]">
        <SummaryCards />
        <RecentActivity />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProjectHealth />
          <LatestDocuments />
        </div>
      </div>
      <div className="space-y-6 lg:w-[30%] lg:min-w-[300px]">
        <ProjectMembersSidebar />
        <UpcomingDeadlines />
        <ProjectIntegrationsSidebar />
      </div>
    </div>
  )
}
