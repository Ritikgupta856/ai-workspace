import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            updatedAt: true,
          },
        },
      },
    })

    const memberUserIds = members.map((m) => m.userId).filter(Boolean) as string[]

    const taskCounts = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        workspaceId: membership.workspaceId,
        assigneeId: { in: memberUserIds },
      },
      _count: {
        id: true,
      },
    })

    const taskCountMap = new Map<string, number>()
    taskCounts.forEach((item) => {
      if (item.assigneeId) {
        taskCountMap.set(item.assigneeId, item._count.id)
      }
    })

    const formattedMembers = members.map((m) => ({
      id: m.id,
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      role: m.role,
      avatar: m.user.image,
      joinedAt: m.createdAt.toISOString(),
      lastActive: m.user.updatedAt.toISOString(),
      taskCount: taskCountMap.get(m.userId) || 0,
    }))

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      currentUserRole: membership.role,
    })
  } catch (error) {
    console.error("Fetch Workspace Members Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch workspace members" },
      { status: 500 }
    )
  }
}
