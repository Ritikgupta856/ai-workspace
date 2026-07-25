import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireProject } from "@/lib/api/guards"

/**
 * Project access is workspace-wide in the current schema — there is no
 * ProjectMember join table — so this returns the workspace roster annotated
 * with each person's workload on *this* project. That's the honest answer, and
 * the task counts are what actually make the tab useful.
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
      prisma.workspaceMember.findMany({
        where: { workspaceId: ctx.workspaceId },
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
