import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildProjectDashboard } from "@/lib/project-dashboard"
import { ProjectDashboardShell } from "@/components/projects/project-dashboard-shell"
import type { ProjectDashboardResponse } from "@/components/projects/project-dashboard-context"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/**
 * Resolves the project's dashboard data on the server so every section
 * (overview, tasks, pages, board) paints complete — no client fetch, no
 * skeleton. Padding lives on each page: tasks runs its header edge-to-edge.
 */
export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string; projectId: string }>
  children: React.ReactNode
}) {
  const { slug, projectId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  // The parent [slug] layout already verified this user is a member of the
  // workspace this slug names — re-resolve the same workspace from the URL
  // rather than an unrelated "first membership" lookup.
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspace: { slug } },
    select: { workspaceId: true },
  })
  if (!membership) redirect(`/${slug}/projects`)

  const dashboard = await buildProjectDashboard(projectId, membership.workspaceId)
  if (!dashboard) notFound()

  const initialData: ProjectDashboardResponse = { success: true, ...dashboard }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectDashboardShell key={projectId} projectId={projectId} initialData={initialData}>
        {children}
      </ProjectDashboardShell>
    </div>
  )
}
