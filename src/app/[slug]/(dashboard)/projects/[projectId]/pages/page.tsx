"use client"

import { useParams } from "next/navigation"
import { FileText } from "lucide-react"

import { ProjectLibraryView } from "@/components/projects/project-library-view"
import { useProjectDashboard } from "@/components/projects/project-dashboard-context"
import { createPage, deletePage, fetchPages } from "@/lib/api/page"

export default function ProjectPagesPage() {
  const { projectId } = useProjectDashboard()
  const slug = useParams().slug as string

  return (
    <ProjectLibraryView
      section="pages"
      noun="page"
      fallbackIcon={FileText}
      load={async () =>
        (await fetchPages(projectId)).map((p) => ({
          id: p.id,
          title: p.title,
          href: `/${slug}/pages/${p.id}`,
          icon: p.icon ?? undefined,
          author: p.createdBy.name,
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
        }))
      }
      create={async () => {
        const page = await createPage({ title: "Untitled", projectId })
        return `/${slug}/pages/${page.id}`
      }}
      remove={deletePage}
      emptyTitle="No pages yet"
      emptyDescription="Create a page to start writing."
    />
  )
}
