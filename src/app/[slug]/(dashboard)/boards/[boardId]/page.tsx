import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/** Boards open inside their project now; forward old `/boards/<id>` links. */
export default async function BoardRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; boardId: string }>
}) {
  const { slug, boardId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const board = await prisma.whiteboard.findFirst({
    where: { id: boardId, workspace: { members: { some: { userId: session.user.id } } } },
    select: { projectId: true },
  })

  if (!board) notFound()
  if (!board.projectId) redirect(`/${slug}/projects`)
  redirect(`/${slug}/projects/${board.projectId}/board/${boardId}`)
}
