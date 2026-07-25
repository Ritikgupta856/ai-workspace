import { tool } from "ai"
import { z } from "zod"

import { apiJson } from "../shared"

const NOTION_VERSION = "2022-06-28"

async function notion<T>(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {}
) {
  return apiJson<T>(`https://api.notion.com/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    errorLabel: `Notion ${path}`,
  })
}

type RichText = { plain_text?: string }

function plain(rich?: RichText[]) {
  return (rich ?? []).map((r) => r.plain_text ?? "").join("")
}

type NotionPage = {
  id: string
  url?: string
  object: string
  last_edited_time?: string
  properties?: Record<
    string,
    { type: string; title?: RichText[]; rich_text?: RichText[] }
  >
  title?: RichText[]
}

function pageTitle(page: NotionPage) {
  if (page.title) return plain(page.title)
  const props = page.properties ?? {}
  for (const value of Object.values(props)) {
    if (value.type === "title") return plain(value.title)
  }
  return "Untitled"
}

export function createNotionTools(token: string) {
  return {
    searchNotion: tool({
      description:
        "Search pages and databases the Notion integration can see. Leave the query empty to list everything shared with Synapse.",
      inputSchema: z.object({
        query: z.string().optional().default(""),
        filter: z.enum(["page", "database", "any"]).optional().default("any"),
        limit: z.number().min(1).max(50).optional().default(20),
      }),
      execute: async ({ query, filter, limit }) => {
        const body: Record<string, unknown> = {
          query: query ?? "",
          page_size: limit ?? 20,
        }
        if (filter && filter !== "any") {
          body.filter = { property: "object", value: filter }
        }

        const data = await notion<{ results: NotionPage[] }>(token, "/search", {
          method: "POST",
          body,
        })

        return data.results.map((r) => ({
          id: r.id,
          object: r.object,
          title: pageTitle(r),
          url: r.url ?? null,
          lastEdited: r.last_edited_time ?? null,
        }))
      },
    }),

    getNotionPage: tool({
      description: "Get a Notion page's properties by id.",
      inputSchema: z.object({ pageId: z.string() }),
      execute: async ({ pageId }) => {
        const page = await notion<NotionPage>(token, `/pages/${pageId}`)
        return {
          id: page.id,
          title: pageTitle(page),
          url: page.url ?? null,
          lastEdited: page.last_edited_time ?? null,
        }
      },
    }),

    getNotionPageContent: tool({
      description:
        "Read the text content of a Notion page, block by block. Use after searchNotion to actually read a page.",
      inputSchema: z.object({
        pageId: z.string(),
        limit: z.number().min(1).max(100).optional().default(80),
      }),
      execute: async ({ pageId, limit }) => {
        const data = await notion<{
          results: Record<string, unknown>[]
        }>(token, `/blocks/${pageId}/children?page_size=${limit ?? 80}`)

        const lines = data.results
          .map((block) => {
            const type = String(block.type ?? "")
            const value = block[type] as { rich_text?: RichText[] } | undefined
            const text = plain(value?.rich_text)
            if (!text) return null
            return { type, text }
          })
          .filter(Boolean)

        return { pageId, blocks: lines }
      },
    }),

    queryNotionDatabase: tool({
      description:
        "Query rows in a Notion database by id. Use searchNotion with filter 'database' to find the id first.",
      inputSchema: z.object({
        databaseId: z.string(),
        limit: z.number().min(1).max(50).optional().default(20),
      }),
      execute: async ({ databaseId, limit }) => {
        const data = await notion<{ results: NotionPage[] }>(
          token,
          `/databases/${databaseId}/query`,
          { method: "POST", body: { page_size: limit ?? 20 } }
        )

        return data.results.map((row) => ({
          id: row.id,
          title: pageTitle(row),
          url: row.url ?? null,
          lastEdited: row.last_edited_time ?? null,
        }))
      },
    }),
  }
}
