"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Upload,
  Bot,
  FileText,
  UserPlus,
  Puzzle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SummaryCards, type StatsData } from "@/components/projects/summary-cards"
import { RecentActivity, type ActivityItemData } from "@/components/projects/recent-activity"
import { ProjectHealth, type HealthData } from "@/components/projects/project-health"
import { LatestDocuments, type DocumentItem } from "@/components/projects/latest-documents"
import { ProjectMembersSidebar, type TeamMemberData } from "@/components/projects/project-members-sidebar"
import { UpcomingDeadlines, type DeadlineData } from "@/components/projects/upcoming-deadlines"
import { ProjectIntegrationsSidebar, type IntegrationItemData } from "@/components/projects/project-integrations-sidebar"

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

const quickActions = [
  {
    label: "New Task",
    icon: Plus,
    href: null,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    label: "Upload Document",
    icon: Upload,
    href: null,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  {
    label: "Start AI Chat",
    icon: Bot,
    href: `/chat`,
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30",
  },
  {
    label: "Create Note",
    icon: FileText,
    href: `/notes`,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    label: "Invite Member",
    icon: UserPlus,
    href: `/members`,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  },
  {
    label: "Connect Integration",
    icon: Puzzle,
    href: `/integrations`,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  },
]

export function ProjectOverview({ data, projectId }: ProjectOverviewProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <SummaryCards stats={data.stats} />

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
          <UpcomingDeadlines deadlines={data.upcomingDeadlines} />
          <ProjectIntegrationsSidebar integrations={data.integrations} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (action.href) router.push(action.href)
                }}
              >
                <div className={cn("flex size-6 items-center justify-center rounded-md", action.color)}>
                  <Icon className="size-3.5" />
                </div>
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


