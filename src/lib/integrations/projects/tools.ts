import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createProjectTools(workspaceId: string) {
  return {
    listProjects: tool({
      description: "List all projects in the workspace",
      inputSchema: z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      }),
      execute: async ({ limit }) => {
        const projects = await prisma.project.findMany({
          where: { workspaceId },
          take: limit ?? 50,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { tasks: true } },
            createdAt: true,
            updatedAt: true,
          },
        })
        return projects
      },
    }),

    getProject: tool({
      description: "Get a specific project by ID with its tasks",
      inputSchema: z.object({
        projectId: z.string(),
      }),
      execute: async ({ projectId }) => {
        const project = await prisma.project.findFirst({
          where: { id: projectId, workspaceId },
          include: {
            _count: { select: { tasks: true } },
          },
        })
        return project
      },
    }),

    createProject: tool({
      description: "Create a new project in the workspace",
      inputSchema: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
      execute: async ({ name, description }) => {
        const project = await prisma.project.create({
          data: { workspaceId, name, description },
        })
        return project
      },
    }),

    updateProject: tool({
      description: "Update an existing project's fields",
      inputSchema: z.object({
        projectId: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
      }),
      execute: async ({ projectId, ...data }) => {
        const updateData: Record<string, unknown> = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description

        const project = await prisma.project.update({
          where: { id: projectId },
          data: updateData,
        })
        return project
      },
    }),

    deleteProject: tool({
      description: "Delete a project by ID",
      inputSchema: z.object({
        projectId: z.string(),
      }),
      execute: async ({ projectId }) => {
        await prisma.project.delete({ where: { id: projectId } })
        return { success: true }
      },
    }),
  }
}
