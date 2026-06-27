"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectDetailsHeader, type ProjectDetailsData } from "@/components/projects/project-details-header"
import { ProjectOverview } from "@/components/projects/project-overview"
import { PROJECT_STATUS_CONFIG, type ProjectStatusKey } from "@/lib/constants"
import type { ProjectTeamMember } from "@/app/(dashboard)/projects/page"

const mockProject: ProjectDetailsData = {
  id: "1",
  name: "Synapse",
  description: "AI-first workspace platform with chat, tasks, documents, and integrations.",
  icon: "🧠",
  status: "ACTIVE" as ProjectStatusKey,
  progress: 72,
  taskCount: 156,
  documentCount: 43,
  chatCount: 287,
  integrationCount: 6,
  members: [
    { id: "u1", name: "Ritik Gupta", role: "Owner", online: true },
    { id: "u2", name: "Priya Sharma", role: "Admin", online: true },
    { id: "u3", name: "Arjun Patel", role: "Member", online: false },
    { id: "u4", name: "Meera Singh", role: "Member", online: true },
    { id: "u5", name: "Vikram Reddy", role: "Member", online: false },
    { id: "u6", name: "Ananya Gupta", role: "Member", online: true },
    { id: "u7", name: "Rohit Verma", role: "Viewer", online: false },
  ],
  updatedAt: "2026-06-27T10:30:00",
  favorite: true,
}

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

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [activeTab, setActiveTab] = React.useState("overview")
  const [project] = React.useState<ProjectDetailsData>(mockProject)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <ProjectDetailsHeader
        project={project}
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

      {activeTab === "overview" && <ProjectOverview />}
      {activeTab !== "overview" && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          {navTabs.find((t) => t.value === activeTab)?.label ?? activeTab} content coming soon.
        </div>
      )}
    </div>
  )
}
