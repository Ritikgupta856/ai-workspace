import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { formatUpdatedDate, formatDueDate } from "@/lib/date"
import type { ProjectStatusKey } from "@/lib/constants"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: projectId } = await params

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: membership.workspaceId },
      include: {
        _count: {
          select: {
            tasks: true,
            documents: true,
            chats: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    // ── Stats ──
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalTasks,
      doneTasks,
      overdueTasks,
      unassignedTasks,
      completedThisWeek,
      tasksCreatedThisWeek,
      documentsCreatedThisWeek,
      totalDocuments,
      totalChats,
      chatsCreatedThisWeek,
      integrations,
    ] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.count({ where: { projectId, status: "DONE" } }),
      prisma.task.count({
        where: { projectId, dueDate: { lt: now }, status: { not: "DONE" } },
      }),
      prisma.task.count({
        where: { projectId, assigneeId: null, status: { not: "DONE" } },
      }),
      prisma.task.count({
        where: { projectId, status: "DONE", updatedAt: { gte: weekAgo } },
      }),
      prisma.task.count({
        where: { projectId, createdAt: { gte: weekAgo } },
      }),
      prisma.document.count({
        where: { projectId, createdAt: { gte: weekAgo } },
      }),
      prisma.document.count({ where: { projectId } }),
      prisma.chat.count({ where: { projectId } }),
      prisma.chat.count({
        where: { projectId, createdAt: { gte: weekAgo } },
      }),
      prisma.integration.findMany({
        where: { workspaceId: membership.workspaceId },
        select: { id: true, type: true, name: true, status: true, updatedAt: true },
      }),
    ])

    const documentsUpdatedThisWeek = await prisma.document.count({
      where: { projectId, updatedAt: { gte: weekAgo } },
    })

    // ── Trend data (last 7 days) ──
    const trendData: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const count = await prisma.task.count({
        where: {
          projectId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      })
      trendData.push(count)
    }

    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    // ── Activity ──
    const recentActivity = await prisma.activity.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    // ── Latest documents ──
    const latestDocuments = await prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        contentType: true,
        createdAt: true,
      },
    })

    // ── Upcoming deadlines ──
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        projectId,
        dueDate: { not: null },
        status: { not: "DONE" },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
      },
    })

    // ── Team members ──
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    const teamMembers = workspaceMembers.map((wm) => ({
      id: wm.user.id,
      name: wm.user.name || wm.user.email,
      email: wm.user.email,
      image: wm.user.image,
      role: wm.role,
      online: false,
    }))

    // ── Health score ──
    const overdueCount = overdueTasks
    const unassignedCount = unassignedTasks
    const healthScore =
      overdueCount === 0 && unassignedCount === 0
        ? "excellent"
        : overdueCount <= 2 && unassignedCount <= 4
          ? "good"
          : overdueCount <= 5
            ? "needsAttention"
            : "atRisk"

    // ── Build response ──
    const response = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        icon: project.icon ?? "📁",
        status: (project.status || "ACTIVE") as ProjectStatusKey,
        progress,
        taskCount: project._count.tasks,
        documentCount: project._count.documents,
        chatCount: project._count.chats,
        integrationCount: integrations.length,
        members: teamMembers.slice(0, 10),
        updatedAt: project.updatedAt.toISOString(),
        favorite: false,
      },
      stats: {
        tasks: {
          total: totalTasks,
          weeklyChange: tasksCreatedThisWeek,
          trend: trendData,
        },
        documents: {
          total: totalDocuments,
          newThisWeek: documentsCreatedThisWeek,
        },
        chats: {
          total: totalChats,
          weeklyIncrease: chatsCreatedThisWeek,
        },
        integrations: {
          total: integrations.length,
          connected: integrations.filter((i) => i.status === "CONNECTED").length,
          disconnected: integrations.filter((i) => i.status !== "CONNECTED").length,
        },
      },
      health: {
        activeTasks: totalTasks - doneTasks,
        completedThisWeek,
        overdueTasks: overdueCount,
        unassignedTasks: unassignedCount,
        documentsUpdated: documentsUpdatedThisWeek,
        score: healthScore as "excellent" | "good" | "needsAttention" | "atRisk",
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        user: {
          id: a.user.id,
          name: a.user.name || "Unknown",
          image: a.user.image,
        },
        action: a.type,
        description: a.description || "",
        target: (a.metadata as any)?.target || "",
        timestamp: formatUpdatedDate(a.createdAt),
        createdAt: a.createdAt.toISOString(),
        type: a.type,
      })),
      latestDocuments: latestDocuments.map((d) => ({
        id: d.id,
        name: d.title,
        contentType: d.contentType,
        updatedAt: formatUpdatedDate(d.createdAt),
        createdAt: d.createdAt.toISOString(),
      })),
      upcomingDeadlines: upcomingDeadlines.map((t) => ({
        id: t.id,
        taskName: t.title,
        dueDate: t.dueDate!.toISOString(),
        dueDateLabel: formatDueDate(t.dueDate),
        priority: t.priority,
      })),
      teamMembers,
      integrations: integrations.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        status: i.status,
        connected: i.status === "CONNECTED",
      })),
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error("Dashboard Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
