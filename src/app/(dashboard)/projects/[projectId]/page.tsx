"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { ProjectDetailsHeader, type ProjectDetailsData } from "@/components/projects/project-details-header"
import { ProjectOverview, type OverviewData } from "@/components/projects/project-overview"
import type { ProjectStatusKey } from "@/lib/constants"

const navTabs = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "chats", label: "Chats" },
  { value: "documents", label: "Documents" },
  { value: "knowledge", label: "Knowledge" },
  { value: "integrations", label: "Integrations" },
  { value: "members", label: "Members" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
]

interface DashboardResponse {
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

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [activeTab, setActiveTab] = React.useState("overview")
  const [data, setData] = React.useState<DashboardResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/projects/${projectId}/dashboard`)
        const json: DashboardResponse = await res.json()
        if (!json.success) {
          throw new Error(json.error || "Failed to load project")
        }
        setData(json)
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive font-medium">
            {error || "Failed to load project"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ProjectDetailsHeader
        project={data.project}
        onFavorite={() => {}}
        onInvite={() => {}}
        onEdit={() => {}}
        onDuplicate={() => {}}
        onArchive={() => {}}
        onDelete={() => {}}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
          {navTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors",
                "hover:text-foreground",
                "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" && (
        <ProjectOverview
          data={{
            stats: data.stats,
            health: data.health,
            recentActivity: data.recentActivity,
            latestDocuments: data.latestDocuments,
            upcomingDeadlines: data.upcomingDeadlines,
            teamMembers: data.teamMembers,
            integrations: data.integrations,
          }}
          projectId={projectId}
        />
      )}
      {activeTab !== "overview" && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          {navTabs.find((t) => t.value === activeTab)?.label ?? activeTab} content coming soon.
        </div>
      )}
    </div>
  )
}
