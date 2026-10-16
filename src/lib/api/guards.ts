import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_HEADER } from "@/lib/workspace-header"

function fail(error: string, status: number) {
  return { error: NextResponse.json({ success: false, error }, { status }) } as const
}

/**
 * The membership for the workspace a request is about. The browser names it:
 * every dashboard call carries the page's slug in `x-workspace-slug` (see
 * `apiFetch`), and full-page navigations pass `slug` from `?workspace=`. A
 * named workspace the user isn't in resolves to null, never to another one.
 * Only a request that names none (an old tab, a script) falls back to the
 * `activeWorkspaceId` cookie, then the user's oldest membership.
 */
export async function findActiveMembership(userId: string, slug?: string | null) {
  const requested = slug || (await headers()).get(WORKSPACE_HEADER)
  if (requested) {
    return prisma.workspaceMember.findFirst({
      where: { userId, workspace: { slug: requested } },
      include: { workspace: true },
    })
  }

  const activeWorkspaceId = (await cookies()).get("activeWorkspaceId")?.value
  return (
    (activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({
          where: { userId, workspaceId: activeWorkspaceId },
          include: { workspace: true },
        })
      : null) ??
    (await prisma.workspaceMember.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { workspace: true },
    }))
  )
}

/** The user's membership in one specific workspace, for records that name their own. */
export function findMembership(userId: string, workspaceId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
}

/** Session + membership of the workspace the request names (see `findActiveMembership`). */
export async function requireWorkspace(slug?: string | null) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return fail("Unauthorized", 401)

  const membership = await findActiveMembership(session.user.id, slug)
  if (!membership) return fail("No workspace found", 404)

  return {
    error: null,
    session,
    membership,
    workspaceId: membership.workspaceId,
  } as const
}

/**
 * Session + the project + membership of the project's own workspace, so it
 * holds whichever workspace page the request came from. "No such project" and
 * "not your workspace" are the same 404, so ids can't be probed.
 */
export async function requireProject(projectId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return fail("Unauthorized", 401)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, workspaceId: true },
  })
  const membership = project ? await findMembership(session.user.id, project.workspaceId) : null
  if (!project || !membership) return fail("Project not found", 404)

  return {
    error: null,
    session,
    membership,
    project,
    workspaceId: project.workspaceId,
  } as const
}

/** Session + the task + membership of the task's own workspace (see `requireProject`). */
export async function requireTask(taskId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return fail("Unauthorized", 401)

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, workspaceId: true, projectId: true, assigneeId: true, createdById: true },
  })
  const membership = task ? await findMembership(session.user.id, task.workspaceId) : null
  if (!task || !membership) return fail("Task not found", 404)

  return {
    error: null,
    session,
    membership,
    task,
    workspaceId: task.workspaceId,
  } as const
}
