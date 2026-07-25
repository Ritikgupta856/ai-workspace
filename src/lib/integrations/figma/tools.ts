import { tool } from "ai"
import { z } from "zod"

import { apiJson } from "../shared"

async function figma<T>(token: string, path: string) {
  return apiJson<T>(`https://api.figma.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    errorLabel: `Figma ${path}`,
  })
}

export function createFigmaTools(token: string) {
  return {
    listFigmaProjects: tool({
      description:
        "List Figma projects for a team. The team id is the number in a figma.com/files/team/<id> URL.",
      inputSchema: z.object({ teamId: z.string() }),
      execute: async ({ teamId }) => {
        const data = await figma<{
          name: string
          projects: { id: string; name: string }[]
        }>(token, `/teams/${teamId}/projects`)
        return { team: data.name, projects: data.projects }
      },
    }),

    listFigmaFiles: tool({
      description:
        "List the files inside a Figma project. Use listFigmaProjects first to get the project id.",
      inputSchema: z.object({ projectId: z.string() }),
      execute: async ({ projectId }) => {
        const data = await figma<{
          name: string
          files: {
            key: string
            name: string
            last_modified: string
            thumbnail_url?: string
          }[]
        }>(token, `/projects/${projectId}/files`)

        return {
          project: data.name,
          files: data.files.map((f) => ({
            key: f.key,
            name: f.name,
            lastModified: f.last_modified,
            url: `https://www.figma.com/file/${f.key}`,
          })),
        }
      },
    }),

    getFigmaFile: tool({
      description:
        "Get a Figma file's structure: its pages and the top-level frames on each. The file key is the id in a figma.com/file/<key> URL.",
      inputSchema: z.object({ fileKey: z.string() }),
      execute: async ({ fileKey }) => {
        const data = await figma<{
          name: string
          lastModified: string
          editorType?: string
          document: {
            children?: { id: string; name: string; children?: { id: string; name: string; type: string }[] }[]
          }
        }>(token, `/files/${fileKey}?depth=2`)

        return {
          name: data.name,
          lastModified: data.lastModified,
          url: `https://www.figma.com/file/${fileKey}`,
          pages: (data.document.children ?? []).map((page) => ({
            id: page.id,
            name: page.name,
            frames: (page.children ?? [])
              .filter((c) => c.type === "FRAME" || c.type === "COMPONENT")
              .map((c) => ({ id: c.id, name: c.name, type: c.type })),
          })),
        }
      },
    }),

    getFigmaComments: tool({
      description:
        "Read the comments on a Figma file — useful for design decisions and feedback the team left on frames.",
      inputSchema: z.object({ fileKey: z.string() }),
      execute: async ({ fileKey }) => {
        const data = await figma<{
          comments: {
            id: string
            message: string
            created_at: string
            resolved_at?: string | null
            user?: { handle?: string }
          }[]
        }>(token, `/files/${fileKey}/comments`)

        return data.comments.map((c) => ({
          id: c.id,
          author: c.user?.handle ?? null,
          message: c.message,
          createdAt: c.created_at,
          resolved: Boolean(c.resolved_at),
        }))
      },
    }),
  }
}
