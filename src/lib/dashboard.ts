import { prisma } from "@/lib/prisma"
import { activityInclude, formatActivity } from "@/lib/activity"
import { calcProgress } from "@/lib/projects"

/**
 * Everything the dashboard renders, in one parallel batch.
 *
 * Deltas are real week-over-week counts (rows created in the last 7 days vs the
 * 7 before that) rather than the invented "+20% vs last week" the page used to
 * hardcode. When there's no prior-period data the delta is null and the UI says
 * nothing instead of claiming growth.
 */

const DAY = 24 * 60 * 60 * 1000

export type Delta = { direction: "up" | "down" | "flat"; percent: number } | null

function delta(current: number, previous: number): Delta {
  // No baseline means no honest comparison to draw.
  if (previous === 0) return null
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 1) return { direction: "flat", percent: 0 }
  return {
    direction: change > 0 ? "up" : "down",
    percent: Math.abs(Math.round(change)),
  }
}

export async function getDashboardData(userId: string, workspaceId: string) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY)
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  const weekAhead = new Date(now.getTime() + 7 * DAY)

  const scope = { workspaceId }
  const openTask = { status: { not: "DONE" as const } }

  const [
    projectCount,
    projectsThisWeek,
    projectsPrevWeek,
    taskCount,
    tasksThisWeek,
    tasksPrevWeek,
    documentCount,
    docsThisWeek,
    docsPrevWeek,
    noteCount,
    notesThisWeek,
    notesPrevWeek,
    completedThisWeek,
    statusGroups,
    myOverdue,
    myDueToday,
    myUpcoming,
    unassignedCount,
    failedDocs,
    activeProjectCount,
    pinnedNoteCount,
    activeProjects,
    integrations,
    memberCount,
    recentActivity,
  ] = await Promise.all([
    prisma.project.count({ where: scope }),
    prisma.project.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    prisma.project.count({
      where: { ...scope, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),

    prisma.task.count({ where: scope }),
    prisma.task.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    prisma.task.count({
      where: { ...scope, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),

    prisma.document.count({ where: scope }),
    prisma.document.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    prisma.document.count({
      where: { ...scope, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),

    prisma.note.count({ where: scope }),
    prisma.note.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    prisma.note.count({
      where: { ...scope, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),

    prisma.task.count({
      where: { ...scope, status: "DONE", updatedAt: { gte: weekAgo } },
    }),

    prisma.task.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),

    // ── The user's own work, which is what a dashboard is actually for ──
    prisma.task.findMany({
      where: {
        ...scope,
        ...openTask,
        assigneeId: userId,
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: taskCardSelect,
    }),
    prisma.task.findMany({
      where: {
        ...scope,
        ...openTask,
        assigneeId: userId,
        dueDate: { gte: now, lte: endOfToday },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: taskCardSelect,
    }),
    prisma.task.findMany({
      where: {
        ...scope,
        ...openTask,
        assigneeId: userId,
        OR: [{ dueDate: { gt: endOfToday, lte: weekAhead } }, { dueDate: null }],
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 5,
      select: taskCardSelect,
    }),

    prisma.task.count({
      where: { ...scope, ...openTask, assigneeId: null },
    }),
    prisma.document.count({
      where: { ...scope, processingStatus: "FAILED" },
    }),

    // Denominators for the ratio bars on the metric cards — each one has to be
    // a real proportion, not a decorative fill.
    prisma.project.count({
      where: { ...scope, status: { not: "ARCHIVED" } },
    }),
    prisma.note.count({ where: { ...scope, pinned: true } }),

    prisma.project.findMany({
      where: { ...scope, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        status: true,
        updatedAt: true,
        _count: { select: { tasks: true } },
      },
    }),

    prisma.integration.findMany({
      where: scope,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        lastSyncAt: true,
        _count: { select: { documents: true } },
      },
    }),

    prisma.workspaceMember.count({ where: scope }),

    prisma.activity.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: activityInclude,
    }),
  ])

  // Done counts per project need a second pass; one grouped query, not N.
  const doneGroups = await prisma.task.groupBy({
    by: ["projectId"],
    where: {
      ...scope,
      status: "DONE",
      projectId: { in: activeProjects.map((p) => p.id) },
    },
    _count: { _all: true },
  })
  const doneByProject = new Map(
    doneGroups.map((g) => [g.projectId as string, g._count._all])
  )

  const byStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  ) as Record<string, number>

  // ── 14-day throughput ──
  // Two bounded queries + an in-memory bucket, rather than 28 count() calls in
  // a loop the way the project dashboard route does it.
  const trendStart = new Date(now.getTime() - 13 * DAY)
  trendStart.setHours(0, 0, 0, 0)

  const [createdRows, completedRows] = await Promise.all([
    prisma.task.findMany({
      where: { ...scope, createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.task.findMany({
      where: { ...scope, status: "DONE", updatedAt: { gte: trendStart } },
      select: { updatedAt: true },
    }),
  ])

  const dayKey = (d: Date) => {
    const copy = new Date(d)
    copy.setHours(0, 0, 0, 0)
    return copy.getTime()
  }

  const createdByDay = new Map<number, number>()
  for (const row of createdRows) {
    const k = dayKey(row.createdAt)
    createdByDay.set(k, (createdByDay.get(k) ?? 0) + 1)
  }
  const completedByDay = new Map<number, number>()
  for (const row of completedRows) {
    const k = dayKey(row.updatedAt)
    completedByDay.set(k, (completedByDay.get(k) ?? 0) + 1)
  }

  const trend = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(trendStart.getTime() + i * DAY)
    const k = dayKey(day)
    return {
      date: day.toISOString(),
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      created: createdByDay.get(k) ?? 0,
      completed: completedByDay.get(k) ?? 0,
    }
  })

  const openTasks =
    (byStatus.TODO ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.IN_REVIEW ?? 0)

  const ratio = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 100) : 0

  return {
    metrics: {
      projects: {
        value: projectCount,
        delta: delta(projectsThisWeek, projectsPrevWeek),
        ratio: ratio(activeProjectCount, projectCount),
        ratioLabel: "active",
      },
      tasks: {
        value: taskCount,
        delta: delta(tasksThisWeek, tasksPrevWeek),
        ratio: ratio(byStatus.DONE ?? 0, taskCount),
        ratioLabel: "done",
      },
      documents: {
        value: documentCount,
        delta: delta(docsThisWeek, docsPrevWeek),
        ratio: ratio(documentCount - failedDocs, documentCount),
        ratioLabel: "processed",
      },
      notes: {
        value: noteCount,
        delta: delta(notesThisWeek, notesPrevWeek),
        ratio: ratio(pinnedNoteCount, noteCount),
        ratioLabel: "pinned",
      },
    },

    trend,

    taskBoard: {
      byStatus,
      total: taskCount,
      openTasks,
      completedThisWeek,
    },

    focus: {
      overdue: myOverdue,
      dueToday: myDueToday,
      upcoming: myUpcoming,
      totalAssigned: myOverdue.length + myDueToday.length + myUpcoming.length,
    },

    attention: {
      overdueCount: myOverdue.length,
      unassignedCount,
      failedDocs,
    },

    projects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      icon: p.icon || "📁",
      status: p.status || "ACTIVE",
      taskCount: p._count.tasks,
      doneCount: doneByProject.get(p.id) ?? 0,
      progress: calcProgress(doneByProject.get(p.id) ?? 0, p._count.tasks),
      updatedAt: p.updatedAt.toISOString(),
    })),

    integrations: integrations.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      status: i.status,
      documentCount: i._count.documents,
      lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
    })),

    memberCount,
    activity: recentActivity.map(formatActivity),
  }
}

const taskCardSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  project: { select: { id: true, name: true, icon: true } },
} as const

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
export type FocusTask = DashboardData["focus"]["overdue"][number]
