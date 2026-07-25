import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

async function currentWorkspace() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })
  if (!membership) return null

  return { userId: session.user.id, workspaceId: membership.workspaceId }
}

export async function GET() {
  const ctx = await currentWorkspace()
  if (!ctx) return NextResponse.json({ boards: [] })

  const boards = await prisma.whiteboard.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { updatedAt: "desc" },
    // The scene is deliberately excluded — a list of boards should not ship
    // every element of every drawing.
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdBy: { select: { name: true, image: true } },
      project: { select: { id: true, name: true, icon: true } },
    },
  })

  return NextResponse.json({ boards })
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, projectId } = (await req.json().catch(() => ({}))) as {
    title?: string
    projectId?: string
  }

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: ctx.workspaceId },
      select: { id: true },
    })
    if (!project) {
      return NextResponse.json({ error: "Unknown project" }, { status: 400 })
    }
  }

  const board = await prisma.whiteboard.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdById: ctx.userId,
      projectId: projectId ?? null,
      title: title?.trim().slice(0, 120) || "Untitled board",
    },
    select: { id: true, title: true, updatedAt: true },
  })

  await logActivity({
    type: "WHITEBOARD_CREATED",
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    projectId: projectId ?? undefined,
    metadata: { target: board.title },
  })

  return NextResponse.json({ board })
}
