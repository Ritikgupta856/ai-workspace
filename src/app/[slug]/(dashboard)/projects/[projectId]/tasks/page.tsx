"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { TaskListView } from "@/components/tasks/task-list-view"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"

export default function ProjectTasksPage() {
  const slug = useParams().slug as string
  const { projectId, data } = useProjectDashboard()

  return (
    <TaskListView
      projectId={projectId}
      title="Tasks"
      breadcrumb={
        <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href={`/${slug}/projects`} className="text-muted-foreground transition-colors hover:text-foreground">
            Projects
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <Link
            href={`/${slug}/projects/${projectId}/overview`}
            className="inline-flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-sm leading-none">{data.project.icon}</span>
            <span className="truncate">{data.project.name}</span>
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-medium text-foreground">Tasks</span>
        </nav>
      }
    />
  )
}
