import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireProject } from "@/lib/api/guards"
import { logActivity } from "@/lib/activity"
import { Role } from "@/generated/prisma/enums"

/**
 * The project's real member list (`ProjectMember`), annotated with each
 * person's workload on *this* project. Task counts are what actually make
 * the tab useful.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const [members, openGroups, doneGroups] = await Promise.all([
      prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.groupBy({
        by: ["assigneeId"],
        where: { projectId: id, status: { not: "DONE" }, assigneeId: { not: null } },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ["assigneeId"],
        where: { projectId: id, status: "DONE", assigneeId: { not: null } },
        _count: { _all: true },
      }),
    ])

    const open = new Map(
      openGroups.map((g) => [g.assigneeId as string, g._count._all])
    )
    const done = new Map(
      doneGroups.map((g) => [g.assigneeId as string, g._count._all])
    )

    const unassignedCount = await prisma.task.count({
      where: { projectId: id, assigneeId: null, status: { not: "DONE" } },
    })

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
        openTasks: open.get(m.user.id) ?? 0,
        completedTasks: done.get(m.user.id) ?? 0,
      })),
      unassignedTasks: unassignedCount,
    })
  } catch (error) {
    console.error("Project Members Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load members." },
      { status: 500 }
    )
  }
}

/** Add a workspace member to this project. Body: `{ userId, role? }`. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const body = await req.json()
    const userId = typeof body.userId === "string" ? body.userId : null
    const role: Role =
      typeof body.role === "string" && body.role in Role ? (body.role as Role) : Role.MEMBER

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      )
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: ctx.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    })

    if (!workspaceMember) {
      return NextResponse.json(
        { success: false, error: "That person isn't in this workspace." },
        { status: 400 }
      )
    }

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role },
      update: { role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    })

    await logActivity({
      type: "PROJECT_MEMBER_ADDED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId: id,
      metadata: { target: member.user.name || member.user.email },
    })

    return NextResponse.json({
      success: true,
      member: {
        id: member.user.id,
        name: member.user.name || member.user.email,
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        joinedAt: member.createdAt.toISOString(),
        openTasks: 0,
        completedTasks: 0,
      },
    })
  } catch (error) {
    console.error("Add Project Member Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add member." },
      { status: 500 }
    )
  }
}

/** Remove a member from this project. Query: `?userId=`. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const userId = new URL(req.url).searchParams.get("userId")
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
      include: { user: { select: { name: true, email: true } } },
    })

    if (!existing) {
      return NextResponse.json({ success: true })
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } },
    })

    await logActivity({
      type: "PROJECT_MEMBER_REMOVED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId: id,
      metadata: { target: existing.user.name || existing.user.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove Project Member Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove member." },
      { status: 500 }
    )
  }
}
