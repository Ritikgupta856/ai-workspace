import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BoardEditor, type BoardData } from "@/components/boards/board-editor"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

export const metadata: Metadata = {
  title: "Board",
  description: "Collaborative whiteboard canvas.",
}

export default async function ProjectBoardEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; boardId: string }>
}) {
  const { projectId, boardId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })
  if (!membership) redirect("/projects")

  // Scoped to the project in the URL so a board can't be opened under the wrong one.
  const board = await prisma.whiteboard.findFirst({
    where: { id: boardId, projectId, workspaceId: membership.workspaceId },
    select: { id: true, title: true, scene: true, files: true, projectId: true },
  })

  if (!board) notFound()

  return <BoardEditor board={board as unknown as BoardData} />
}
