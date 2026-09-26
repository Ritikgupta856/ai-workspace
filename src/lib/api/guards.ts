import { cookies, headers } from "next/headers"
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

/**
 * The membership for the workspace the user is looking at (the
 * `activeWorkspaceId` cookie), falling back to their first one. Without the
 * cookie, a user in two workspaces gets whichever row Postgres returns first.
 */
export async function findActiveMembership(userId: string) {
  const activeWorkspaceId = (await cookies()).get("activeWorkspaceId")?.value
  return (
    (activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({ where: { userId, workspaceId: activeWorkspaceId } })
      : null) ?? (await prisma.workspaceMember.findFirst({ where: { userId } }))
  )
}

/** Session + workspace membership only, for routes that aren't scoped to one project. */
export async function requireWorkspace() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    } as const
  }

  const membership = await findActiveMembership(session.user.id)

  if (!membership) {
    return {
      error: NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      ),
    } as const
  }

  return {
    error: null,
    session,
    membership,
    workspaceId: membership.workspaceId,
  } as const
}

/** Session + workspace membership + the task belongs to that workspace. */
export async function requireTask(taskId: string) {
  const ctx = await requireWorkspace()
  if (ctx.error) return ctx

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
    select: { id: true, title: true, workspaceId: true, projectId: true, assigneeId: true, createdById: true },
  })

  if (!task) {
    return {
      error: NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      ),
    } as const
  }

  return { ...ctx, error: null, task } as const
}
