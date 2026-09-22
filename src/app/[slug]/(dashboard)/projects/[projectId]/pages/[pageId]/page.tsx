import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { PageDetailView } from "@/components/pages/page-detail-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/**
 * A project's page, opened under the project that owns it — the same shape as
 * `projects/<id>/board/<boardId>`, so every project surface reads
 * project-first in both the URL and the breadcrumb.
 */
export default async function ProjectPageDetail({
  params,
}: {
  params: Promise<{ slug: string; projectId: string; pageId: string }>
}) {
  const { slug, projectId, pageId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspace: { slug } },
    select: { workspaceId: true },
  })
  if (!membership) redirect(`/${slug}/projects`)

  // Scoped to the project in the URL so a page can't be opened under the wrong one.
  const page = await prisma.page.findFirst({
    where: { id: pageId, projectId, workspaceId: membership.workspaceId },
    select: { id: true },
  })
  if (!page) notFound()

  return <PageDetailView pageId={pageId} />
}
