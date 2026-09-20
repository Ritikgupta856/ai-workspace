import { tool, type ToolSet } from "ai"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { formatProject, projectInclude, PROJECT_STATUSES } from "@/lib/projects"
import { formatNote, noteInclude } from "@/lib/notes"
import { buildProjectDashboard } from "@/lib/project-dashboard"
import { getDashboardData } from "@/lib/dashboard"
import { pageContentToText } from "@/lib/pages"

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export function getWorkspaceReadTools(
  workspaceId: string,
  userId: string
): ToolSet {
  return {
    search_tasks: tool({
      description:
        "Search this workspace's tasks. Filter by status, priority, project, assignee, or a due-date range, and/or match text against the title and description. Use this before answering any question about tasks, work items, or what someone is working on.",
      inputSchema: z.object({
        query: z.string().optional().describe("Text to match against task title/description"),
        status: z.enum(TASK_STATUSES).optional(),
        priority: z.enum(TASK_PRIORITIES).optional(),
        projectId: z.string().optional(),
        assigneeId: z.string().optional(),
        dueBefore: z.string().optional().describe("ISO date; only tasks due on or before this date"),
        dueAfter: z.string().optional().describe("ISO date; only tasks due on or after this date"),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async ({ query, status, priority, projectId, assigneeId, dueBefore, dueAfter, limit }) => {
        const dueDate: { lte?: Date; gte?: Date } = {}
        if (dueBefore) dueDate.lte = new Date(dueBefore)
        if (dueAfter) dueDate.gte = new Date(dueAfter)

        const tasks = await prisma.task.findMany({
          where: {
            workspaceId,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(projectId && { projectId }),
            ...(assigneeId && { assigneeId }),
            ...(Object.keys(dueDate).length > 0 && { dueDate }),
            ...(query && {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }),
          },
          orderBy: { updatedAt: "desc" },
          take: limit ?? 20,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            labels: true,
            project: { select: { name: true } },
            assignee: { select: { name: true, email: true } },
          },
        })

        return tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          project: t.project?.name ?? null,
          assignee: t.assignee ? t.assignee.name || t.assignee.email : null,
          dueDate: t.dueDate?.toISOString() ?? null,
          labels: t.labels,
        }))
      },
    }),

    get_task: tool({
      description: "Get full detail on one task by id, including its description, subtasks, and comment count.",
      inputSchema: z.object({ taskId: z.string() }),
      execute: async ({ taskId }) => {
        const task = await prisma.task.findFirst({
          where: { id: taskId, workspaceId },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            labels: true,
            createdAt: true,
            updatedAt: true,
            project: { select: { id: true, name: true } },
            assignee: { select: { name: true, email: true } },
            createdBy: { select: { name: true, email: true } },
            subtasks: { select: { id: true, title: true, status: true } },
            _count: { select: { comments: true } },
          },
        })

        if (!task) return { error: "No task with that id in this workspace." }

        return {
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          project: task.project,
          assignee: task.assignee ? task.assignee.name || task.assignee.email : null,
          createdBy: task.createdBy.name || task.createdBy.email,
          dueDate: task.dueDate?.toISOString() ?? null,
          labels: task.labels,
          subtasks: task.subtasks,
          commentCount: task._count.comments,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }
      },
    }),

    list_projects: tool({
      description: "List this workspace's projects with their status and progress.",
      inputSchema: z.object({
        status: z.enum(PROJECT_STATUSES).optional(),
      }),
      execute: async ({ status }) => {
        const [projects, doneGroups, integrationCount] = await Promise.all([
          prisma.project.findMany({
            where: { workspaceId, ...(status && { status }) },
            include: projectInclude,
            orderBy: { updatedAt: "desc" },
          }),
          prisma.task.groupBy({
            by: ["projectId"],
            where: { workspaceId, status: "DONE", projectId: { not: null } },
            _count: { _all: true },
          }),
          prisma.integration.count({ where: { workspaceId } }),
        ])

        const doneByProject = new Map(doneGroups.map((g) => [g.projectId as string, g._count._all]))

        // Each project's own members, not the whole workspace roster.
        const projectMembers = await prisma.projectMember.findMany({
          where: { projectId: { in: projects.map((p) => p.id) } },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        })
        const membersByProject = new Map<string, typeof projectMembers>()
        for (const pm of projectMembers) {
          const list = membersByProject.get(pm.projectId) ?? []
          list.push(pm)
          membersByProject.set(pm.projectId, list)
        }

        return projects.map((project) =>
          formatProject(project, {
            doneTasks: doneByProject.get(project.id) ?? 0,
            members: (membersByProject.get(project.id) ?? []).map((m) => ({
              id: m.user.id,
              name: m.user.name || m.user.email,
              role: m.role,
            })),
            integrationCount,
          })
        )
      },
    }),

    get_project: tool({
      description:
        "Get a full status report on one project: task breakdown, health (overdue/unassigned work), recent activity, upcoming deadlines, and members.",
      inputSchema: z.object({ projectId: z.string() }),
      execute: async ({ projectId }) => {
        const dashboard = await buildProjectDashboard(projectId, workspaceId)
        if (!dashboard) return { error: "No project with that id in this workspace." }

        return {
          project: {
            name: dashboard.project.name,
            description: dashboard.project.description,
            status: dashboard.project.status,
            progress: dashboard.project.progress,
            taskCount: dashboard.project.taskCount,
            updatedAt: dashboard.project.updatedAt,
          },
          health: dashboard.health,
          upcomingDeadlines: dashboard.upcomingDeadlines,
          recentActivity: dashboard.recentActivity
            .slice(0, 5)
            .map((a) => ({ description: a.description, user: a.user.name, createdAt: a.createdAt })),
          members: dashboard.project.members.map((m) => ({ name: m.name, role: m.role })),
        }
      },
    }),

    get_workspace_overview: tool({
      description:
        "Get a broad snapshot of the whole workspace: task/project/document/note counts, the current user's overdue and upcoming work, unassigned tasks, and recent activity. Use this for open-ended 'what's going on' questions before doing several separate lookups.",
      inputSchema: z.object({}),
      execute: async () => {
        const data = await getDashboardData(userId, workspaceId)
        return {
          metrics: data.metrics,
          taskBoard: data.taskBoard,
          myFocus: {
            overdue: data.focus.overdue.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
            dueToday: data.focus.dueToday.map((t) => ({ id: t.id, title: t.title })),
            upcoming: data.focus.upcoming.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
          },
          attention: data.attention,
          projects: data.projects,
          memberCount: data.memberCount,
          recentActivity: data.activity.slice(0, 8).map((a) => ({ description: a.description, user: a.user.name, createdAt: a.createdAt })),
        }
      },
    }),

    search_notes: tool({
      description: "Search this workspace's notes by title/content text, project, or tag.",
      inputSchema: z.object({
        query: z.string().optional(),
        projectId: z.string().optional(),
        tag: z.string().optional(),
        limit: z.number().int().min(1).max(30).optional(),
      }),
      execute: async ({ query, projectId, tag, limit }) => {
        const notes = await prisma.note.findMany({
          where: {
            workspaceId,
            ...(projectId && { projectId }),
            ...(tag && { tags: { has: tag } }),
            ...(query && {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
              ],
            }),
          },
          include: noteInclude,
          orderBy: { updatedAt: "desc" },
          take: limit ?? 10,
        })

        return notes.map((note) => {
          const formatted = formatNote(note)
          return {
            id: formatted.id,
            title: formatted.title,
            preview: formatted.preview,
            tags: formatted.tags,
            author: formatted.author,
            pinned: formatted.pinned,
            projectId: formatted.projectId,
            updatedAt: formatted.updatedAt,
          }
        })
      },
    }),

    get_note: tool({
      description: "Get the full content of one note by id.",
      inputSchema: z.object({ noteId: z.string() }),
      execute: async ({ noteId }) => {
        const note = await prisma.note.findFirst({
          where: { id: noteId, workspaceId },
          include: noteInclude,
        })

        if (!note) return { error: "No note with that id in this workspace." }
        return formatNote(note)
      },
    }),

    search_pages: tool({
      description: "Search this workspace's pages (rich documents) by title, optionally scoped to a project.",
      inputSchema: z.object({
        query: z.string().optional(),
        projectId: z.string().optional(),
        limit: z.number().int().min(1).max(30).optional(),
      }),
      execute: async ({ query, projectId, limit }) => {
        const pages = await prisma.page.findMany({
          where: {
            workspaceId,
            ...(projectId && { projectId }),
            ...(query && { title: { contains: query, mode: "insensitive" } }),
          },
          select: { id: true, title: true, icon: true, projectId: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: limit ?? 10,
        })

        return pages.map((p) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          projectId: p.projectId,
          updatedAt: p.updatedAt.toISOString(),
        }))
      },
    }),

    get_page: tool({
      description: "Get the full text content of one page by id.",
      inputSchema: z.object({ pageId: z.string() }),
      execute: async ({ pageId }) => {
        const page = await prisma.page.findFirst({
          where: { id: pageId, workspaceId },
          select: { id: true, title: true, content: true, projectId: true, updatedAt: true },
        })

        if (!page) return { error: "No page with that id in this workspace." }

        return {
          id: page.id,
          title: page.title,
          projectId: page.projectId,
          content: pageContentToText(page.content),
          updatedAt: page.updatedAt.toISOString(),
        }
      },
    }),
  }
}
