import { prisma } from "@/lib/prisma"
import { activityInclude, formatActivity } from "@/lib/activity"
import { calcProgress } from "@/lib/projects"

/**
 * Everything the Home page renders, in one parallel batch.
 *
 * "At risk" is derived, not stored: an active project with at least one open,
 * overdue task. That keeps the stat strip and the project table agreeing
 * without a new column.
 */

const DAY = 24 * 60 * 60 * 1000

const taskSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
} as const

export type HomeProjectState = "IN_PROGRESS" | "AT_RISK" | "ON_HOLD" | "COMPLETED"

export async function getHomeData(userId: string, workspaceId: string) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTomorrow = new Date(startOfToday.getTime() + DAY)
  const startOfDayAfter = new Date(startOfToday.getTime() + 2 * DAY)
  const weekAhead = new Date(startOfToday.getTime() + 7 * DAY)

  const scope = { workspaceId }
  const open = { status: { not: "DONE" as const } }
  const mine = { ...scope, assigneeId: userId }

  const [
    activeProjectCount,
    openTaskCount,
    myOpenCount,
    completedThisWeek,
    overdueCount,
    myOverdue,
    myUpcoming,
    myCompleted,
    myOverdueCount,
    myUpcomingCount,
    myCompletedCount,
    dueToday,
    dueTomorrow,
    dueThisWeek,
    projects,
    overdueByProject,
    recentActivity,
  ] = await Promise.all([
    prisma.project.count({ where: { ...scope, status: { not: "ARCHIVED" } } }),
    prisma.task.count({ where: { ...scope, ...open } }),
    prisma.task.count({ where: { ...mine, ...open } }),
    prisma.task.count({ where: { ...scope, status: "DONE", updatedAt: { gte: weekAgo } } }),
    prisma.task.count({ where: { ...scope, ...open, dueDate: { lt: startOfToday } } }),

    // ── My tasks, one list per tab ──
    prisma.task.findMany({
      where: { ...mine, ...open, dueDate: { lt: startOfToday } },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...mine, ...open, OR: [{ dueDate: { gte: startOfToday } }, { dueDate: null }] },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
      take: 8,
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...mine, status: "DONE", updatedAt: { gte: weekAgo } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: taskSelect,
    }),
    prisma.task.count({ where: { ...mine, ...open, dueDate: { lt: startOfToday } } }),
    prisma.task.count({
      where: { ...mine, ...open, OR: [{ dueDate: { gte: startOfToday } }, { dueDate: null }] },
    }),
    prisma.task.count({ where: { ...mine, status: "DONE", updatedAt: { gte: weekAgo } } }),

    // ── Deadlines across the workspace, bucketed by day ──
    prisma.task.findMany({
      where: { ...scope, ...open, dueDate: { gte: startOfToday, lt: startOfTomorrow } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 4,
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...scope, ...open, dueDate: { gte: startOfTomorrow, lt: startOfDayAfter } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 4,
      select: taskSelect,
    }),
    prisma.task.findMany({
      where: { ...scope, ...open, dueDate: { gte: startOfDayAfter, lt: weekAhead } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 6,
      select: taskSelect,
    }),

    prisma.project.findMany({
      where: { ...scope, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        icon: true,
        status: true,
        _count: { select: { tasks: true } },
        members: {
          take: 4,
          orderBy: { createdAt: "asc" },
          select: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    }),
    prisma.task.groupBy({
      by: ["projectId"],
      where: { ...scope, ...open, projectId: { not: null }, dueDate: { lt: startOfToday } },
      _count: { _all: true },
    }),

    prisma.activity.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 7,
      include: activityInclude,
    }),
  ])

  const projectIds = projects.map((p) => p.id)

  // Per-project numbers need grouped queries scoped to the rows we're showing:
  // done counts, next open due date, and total member count (for the "+N").
  const [doneGroups, nextDueGroups, memberGroups, dueTodayCount, dueTomorrowCount, dueWeekCount] =
    await Promise.all([
      prisma.task.groupBy({
        by: ["projectId"],
        where: { ...scope, status: "DONE", projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ["projectId"],
        where: { ...scope, ...open, dueDate: { gte: startOfToday }, projectId: { in: projectIds } },
        _min: { dueDate: true },
      }),
      prisma.projectMember.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      prisma.task.count({
        where: { ...scope, ...open, dueDate: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      prisma.task.count({
        where: { ...scope, ...open, dueDate: { gte: startOfTomorrow, lt: startOfDayAfter } },
      }),
      prisma.task.count({
        where: { ...scope, ...open, dueDate: { gte: startOfDayAfter, lt: weekAhead } },
      }),
    ])

  const doneBy = new Map(doneGroups.map((g) => [g.projectId as string, g._count._all]))
  const nextDueBy = new Map(nextDueGroups.map((g) => [g.projectId as string, g._min.dueDate]))
  const membersBy = new Map(memberGroups.map((g) => [g.projectId, g._count._all]))
  const overdueBy = new Map(overdueByProject.map((g) => [g.projectId as string, g._count._all]))

  const projectRows = projects.map((p) => {
    const done = doneBy.get(p.id) ?? 0
    const progress = calcProgress(done, p._count.tasks)
    let state: HomeProjectState = "IN_PROGRESS"
    if (p.status === "ON_HOLD") state = "ON_HOLD"
    else if (p.status === "COMPLETED") state = "COMPLETED"
    else if ((overdueBy.get(p.id) ?? 0) > 0) state = "AT_RISK"

    return {
      id: p.id,
      name: p.name,
      icon: p.icon || "📁",
      state,
      progress,
      nextDue: nextDueBy.get(p.id)?.toISOString() ?? null,
      members: p.members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        image: m.user.image,
      })),
      extraMembers: Math.max(0, (membersBy.get(p.id) ?? 0) - p.members.length),
    }
  })

  const atRiskCount = projectRows.filter((p) => p.state === "AT_RISK").length

  const toTask = (t: (typeof myOverdue)[number]) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    project: t.project,
    assignee: t.assignee
      ? { id: t.assignee.id, name: t.assignee.name || t.assignee.email, image: t.assignee.image }
      : null,
  })

  return {
    stats: {
      activeProjects: activeProjectCount,
      atRisk: atRiskCount,
      openTasks: openTaskCount,
      assignedToYou: myOpenCount,
      completedThisWeek,
      overdue: overdueCount,
    },
    myTasks: {
      upcoming: { count: myUpcomingCount, items: myUpcoming.map(toTask) },
      overdue: { count: myOverdueCount, items: myOverdue.map(toTask) },
      completed: { count: myCompletedCount, items: myCompleted.map(toTask) },
    },
    deadlines: [
      { key: "today", label: "Today", count: dueTodayCount, items: dueToday.map(toTask) },
      { key: "tomorrow", label: "Tomorrow", count: dueTomorrowCount, items: dueTomorrow.map(toTask) },
      { key: "week", label: "This week", count: dueWeekCount, items: dueThisWeek.map(toTask) },
    ],
    projects: projectRows,
    activity: recentActivity.map(formatActivity),
  }
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>
export type HomeTask = HomeData["myTasks"]["upcoming"]["items"][number]
