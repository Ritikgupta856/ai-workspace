import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createTaskTools(workspaceId: string, userId?: string) {
  return {
    listTasks: tool({
      description: "List tasks in the workspace, optionally filtered by status, priority, or assignee",
      inputSchema: z.object({
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assigneeId: z.string().optional(),
        projectId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      }),
      execute: async ({ status, priority, assigneeId, projectId, limit }) => {
        const tasks = await prisma.task.findMany({
          where: {
            workspaceId,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId && { assigneeId }),
            ...(projectId && { projectId }),
          },
          take: limit ?? 50,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
            dueDate: true,
            labels: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        return tasks
      },
    }),

    getTask: tool({
      description: "Get a specific task by ID with full details including subtasks",
      inputSchema: z.object({
        taskId: z.string().describe("The ID of the task"),
      }),
      execute: async ({ taskId }) => {
        const task = await prisma.task.findFirst({
          where: { id: taskId, workspaceId },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
            subtasks: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        })
        return task
      },
    }),

    createTask: tool({
      description: "Create a new task in the workspace",
      inputSchema: z.object({
        title: z.string().min(1).describe("Task title"),
        description: z.string().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional().default("TODO"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
        assigneeId: z.string().optional().describe("User ID to assign the task to"),
        projectId: z.string().optional(),
        labels: z.array(z.string()).optional(),
        dueDate: z.string().datetime().optional().describe("ISO 8601 date string"),
      }),
      execute: async ({ title, description, status, priority, assigneeId, projectId, labels, dueDate }) => {
        if (!userId) throw new Error("User ID not available — cannot create task")
        const task = await prisma.task.create({
          data: {
            workspaceId,
            title,
            description: description ?? "",
            status: status ?? "TODO",
            priority: priority ?? "MEDIUM",
            assigneeId,
            projectId,
            labels: labels ?? [],
            dueDate: dueDate ? new Date(dueDate) : null,
            createdById: userId,
          },
        })
        return task
      },
    }),

    updateTask: tool({
      description: "Update an existing task's fields",
      inputSchema: z.object({
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assigneeId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        labels: z.array(z.string()).optional(),
        dueDate: z.string().datetime().nullable().optional(),
      }),
      execute: async ({ taskId, ...data }) => {
        const updateData: Record<string, unknown> = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.status !== undefined) updateData.status = data.status
        if (data.priority !== undefined) updateData.priority = data.priority
        if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
        if (data.projectId !== undefined) updateData.projectId = data.projectId
        if (data.labels !== undefined) updateData.labels = data.labels
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

        const task = await prisma.task.update({
          where: { id: taskId },
          data: updateData,
        })
        return task
      },
    }),
  }
}
