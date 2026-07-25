import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Every project sub-route repeats the same three checks: is there a session,
 * is the user in a workspace, and does the project belong to it. This collapses
 * that into one call so a new route can't accidentally skip the scoping check.
 */
export async function requireProject(projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    } as const
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!membership) {
    return {
      error: NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      ),
    } as const
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: membership.workspaceId },
    select: { id: true, name: true, workspaceId: true },
  })

  if (!project) {
    return {
      error: NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      ),
    } as const
  }

  return {
    error: null,
    session,
    membership,
    project,
    workspaceId: membership.workspaceId,
  } as const
}
