import { tool } from "ai"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export function createNoteTools(workspaceId: string, userId?: string) {
  return {
    listNotes: tool({
      description: "List notes in the workspace, optionally filtered by tag or search term",
      inputSchema: z.object({
        tag: z.string().optional().describe("Filter by tag"),
        search: z.string().optional().describe("Search in title and content"),
        pinned: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
      }),
      execute: async ({ tag, search, pinned, limit }) => {
        const notes = await prisma.note.findMany({
          where: {
            workspaceId,
            ...(tag && { tags: { has: tag } }),
            ...(pinned !== undefined && { pinned }),
            ...(search && {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
              ],
            }),
          },
          take: limit ?? 50,
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            content: true,
            tags: true,
            pinned: true,
            author: { select: { id: true, name: true } },
            createdAt: true,
            updatedAt: true,
          },
        })
        return notes
      },
    }),

    getNote: tool({
      description: "Get a specific note by ID with full content",
      inputSchema: z.object({
        noteId: z.string().describe("The ID of the note"),
      }),
      execute: async ({ noteId }) => {
        const note = await prisma.note.findFirst({
          where: { id: noteId, workspaceId },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        })
        return note
      },
    }),

    createNote: tool({
      description: "Create a new note in the workspace",
      inputSchema: z.object({
        title: z.string().min(1).describe("Note title"),
        content: z.string().optional().default(""),
        tags: z.array(z.string()).optional().default([]),
        pinned: z.boolean().optional().default(false),
      }),
      execute: async ({ title, content, tags, pinned }) => {
        if (!userId) throw new Error("User ID not available — cannot create note")
        const note = await prisma.note.create({
          data: {
            workspaceId,
            title,
            content: content ?? "",
            tags: tags ?? [],
            pinned: pinned ?? false,
            authorId: userId,
          },
        })
        return note
      },
    }),

    updateNote: tool({
      description: "Update an existing note's fields",
      inputSchema: z.object({
        noteId: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean().optional(),
      }),
      execute: async ({ noteId, ...data }) => {
        const updateData: Record<string, unknown> = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.content !== undefined) updateData.content = data.content
        if (data.tags !== undefined) updateData.tags = data.tags
        if (data.pinned !== undefined) updateData.pinned = data.pinned

        const note = await prisma.note.update({
          where: { id: noteId },
          data: updateData,
        })
        return note
      },
    }),

    deleteNote: tool({
      description: "Delete a note by ID",
      inputSchema: z.object({
        noteId: z.string(),
      }),
      execute: async ({ noteId }) => {
        await prisma.note.delete({
          where: { id: noteId },
        })
        return { success: true }
      },
    }),
  }
}
