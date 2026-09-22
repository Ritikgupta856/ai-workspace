import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { PageDetailView } from "@/components/pages/page-detail-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/**
 * Workspace-level pages, and a forwarder for old links.
 *
 * A page that belongs to a project now lives at
 * `/<slug>/projects/<projectId>/pages/<pageId>`; anything already pointing here
 * — a bookmark, a favourite, a link in a comment — is redirected there rather
 * than rendering the same document at a second URL. Pages with no project have
 * no project route to move to, so they stay here.
 */
export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string; pageId: string }>
}) {
  const { slug, pageId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspace: { slug } },
    select: { workspaceId: true },
  })
  if (!membership) redirect(`/${slug}/pages`)

  const page = await prisma.page.findFirst({
    where: { id: pageId, workspaceId: membership.workspaceId },
    select: { id: true, projectId: true },
  })
  if (!page) notFound()

  if (page.projectId) {
    redirect(`/${slug}/projects/${page.projectId}/pages/${pageId}`)
  }

  return <PageDetailView pageId={pageId} />
}
