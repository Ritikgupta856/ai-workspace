"use client"

import { useParams } from "next/navigation"
import { PenTool } from "lucide-react"

import { ProjectLibraryView } from "@/components/projects/project-library-view"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"
import { createProjectBoard, deleteBoard, fetchProjectBoards } from "@/lib/api/projects"

export default function ProjectBoardPage() {
  const { projectId } = useProjectDashboard()
  const slug = useParams().slug as string

  return (
    <ProjectLibraryView
      section="board"
      noun="board"
      fallbackIcon={PenTool}
      load={async () =>
        (await fetchProjectBoards(projectId)).map((b) => ({
          id: b.id,
          title: b.title,
          href: `/${slug}/projects/${projectId}/board/${b.id}`,
          author: b.createdBy?.name ?? null,
          updatedAt: b.updatedAt,
        }))
      }
      create={async () => {
        const board = await createProjectBoard(projectId)
        return `/${slug}/projects/${projectId}/board/${board.id}`
      }}
      remove={deleteBoard}
      emptyTitle="No boards yet"
      emptyDescription="Whiteboards created for this project show up here."
    />
  )
}
