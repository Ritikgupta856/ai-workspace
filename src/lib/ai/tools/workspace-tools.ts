import { tool, type ToolSet } from "ai"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { formatProject, projectInclude, PROJECT_STATUSES } from "@/lib/projects"
import { buildProjectDashboard } from "@/lib/project-dashboard"
import { getDashboardData } from "@/lib/dashboard"
import { pageContentToText } from "@/lib/pages"
import { logActivity } from "@/lib/activity"
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums"

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
        "Get a broad snapshot of the whole workspace: task/project/document/page counts, the current user's overdue and upcoming work, unassigned tasks, and recent activity. Use this for open-ended 'what's going on' questions before doing several separate lookups.",
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

/**
 * Write tools — kept in their own function, separate from
 * `getWorkspaceReadTools`, on purpose: nothing here has a confirmation step
 * yet (no UI pauses execution before a write runs), so every one of these
 * fires the instant the model calls it. Each tool's description says so
 * explicitly, so the model only reaches for one when the user's intent is
 * unambiguous rather than offering to create something speculatively.
 *
 * Validation and activity logging mirror the equivalent API routes exactly
 * (`POST /api/projects`, `POST /api/tasks/generate`, `POST /api/pages`) so a
 * project/task/page created by the agent is indistinguishable in the
 * database from one created by hand, except for the `generatedByAI` flag.
 */
export function getWorkspaceWriteTools(
  workspaceId: string,
  userId: string
): ToolSet {
  return {
    create_task: tool({
      description:
        "Create a new task in this workspace. Creates immediately — there is no confirmation step and no undo. Only call this when the user has clearly asked for a task to be created and given (or you already know) its title; if the title, project, or assignee is ambiguous, ask before calling.",
      inputSchema: z.object({
        title: z.string().min(1).describe("The task title. Required."),
        description: z.string().optional(),
        projectId: z.string().optional().describe("Must be a project in this workspace."),
        priority: z.enum(TASK_PRIORITIES).optional().describe("Defaults to MEDIUM."),
        status: z.enum(TASK_STATUSES).optional().describe("Defaults to TODO."),
        assigneeId: z.string().optional().describe("Must be a member of this workspace."),
        dueDate: z.string().optional().describe("ISO date, e.g. 2026-10-01."),
        labels: z.array(z.string()).optional(),
      }),
      execute: async ({ title, description, projectId, priority, status, assigneeId, dueDate, labels }) => {
        if (projectId) {
          const project = await prisma.project.findFirst({
            where: { id: projectId, workspaceId },
            select: { id: true },
          })
          if (!project) return { error: "No project with that id in this workspace." }
        }

        if (assigneeId) {
          const member = await prisma.workspaceMember.findFirst({
            where: { userId: assigneeId, workspaceId },
            select: { userId: true },
          })
          if (!member) return { error: "That person isn't a member of this workspace." }
        }

        const task = await prisma.task.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            projectId: projectId ?? null,
            priority: (priority as TaskPriority) ?? TaskPriority.MEDIUM,
            status: (status as TaskStatus) ?? TaskStatus.TODO,
            assigneeId: assigneeId ?? null,
            dueDate: dueDate ? new Date(dueDate) : null,
            workspaceId,
            createdById: userId,
            labels: labels ?? [],
            generatedByAI: true,
          },
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true, email: true } },
          },
        })

        await logActivity({
          type: "TASK_CREATED",
          workspaceId,
          userId,
          projectId: task.projectId ?? undefined,
          taskId: task.id,
          metadata: { target: task.title, generatedByAI: true },
        })

        return {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          project: task.project?.name ?? null,
          assignee: task.assignee ? task.assignee.name || task.assignee.email : null,
          dueDate: task.dueDate?.toISOString() ?? null,
        }
      },
    }),

    create_project: tool({
      description:
        "Create a new project in this workspace. Creates immediately — there is no confirmation step and no undo. Only call this when the user has clearly asked for a project to be created and given its name.",
      inputSchema: z.object({
        name: z.string().min(1).describe("The project name. Required."),
        description: z.string().optional(),
        icon: z.string().optional().describe("A single emoji to represent the project."),
      }),
      execute: async ({ name, description, icon }) => {
        const project = await prisma.project.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            icon: icon || null,
            workspaceId,
          },
          include: projectInclude,
        })

        await prisma.projectMember.create({
          data: { projectId: project.id, userId, role: "OWNER" },
        })

        await logActivity({
          type: "PROJECT_CREATED",
          workspaceId,
          userId,
          projectId: project.id,
          description: `created project ${project.name}`,
          metadata: { target: project.name, generatedByAI: true },
        })

        const creator = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, image: true },
        })

        return formatProject(project, {
          doneTasks: 0,
          members: creator
            ? [{ id: creator.id, name: creator.name || creator.email, email: creator.email, image: creator.image, role: "OWNER" }]
            : [],
          integrationCount: 0,
        })
      },
    }),

    create_page: tool({
      description:
        "Create a new page (rich document) inside a project. Every page belongs to a project: if the user didn't name one, use list_projects and pick the one the page is about, or ask which project when it's unclear. Creates immediately — there is no confirmation step and no undo. Content is left empty; the page is created as a container the user opens and fills in themselves, so a title and project are enough to call this.",
      inputSchema: z.object({
        title: z.string().optional().describe('Defaults to "Untitled" if omitted.'),
        projectId: z.string().describe("The project the page belongs to. Must be a project in this workspace."),
        icon: z.string().optional().describe("A single emoji to represent the page."),
      }),
      execute: async ({ title, projectId, icon }) => {
        const project = await prisma.project.findFirst({
          where: { id: projectId, workspaceId },
          select: { id: true },
        })
        if (!project) return { error: "No project with that id in this workspace." }

        const page = await prisma.page.create({
          data: {
            title: title?.trim() || "Untitled",
            workspaceId,
            projectId,
            icon: icon || null,
            createdById: userId,
          },
          select: { id: true, title: true, icon: true, projectId: true, updatedAt: true },
        })

        await logActivity({
          type: "PAGE_CREATED",
          workspaceId,
          userId,
          projectId: page.projectId,
          description: `created page ${page.title}`,
          metadata: { target: page.title, generatedByAI: true },
        })

        return {
          id: page.id,
          title: page.title,
          icon: page.icon,
          projectId: page.projectId,
          updatedAt: page.updatedAt.toISOString(),
        }
      },
    }),
  }
}
