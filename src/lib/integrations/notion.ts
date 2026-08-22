import { z } from "zod"
import { tool, zodSchema } from "ai"
import type { ToolSet } from "ai"

const NOTION_VERSION = "2022-06-28"

async function notionRequest(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Notion API Error (${response.status}): ${text}`)
  }
  return response.json()
}

function extractText(richTextArr: any[]): string {
  if (!richTextArr || !Array.isArray(richTextArr)) return ""
  return richTextArr.map((t: any) => t.plain_text || "").join("")
}

function formatBlock(block: any): string {
  const type = block.type
  if (!type || !block[type]) return ""

  const data = block[type]
  const text = extractText(data.rich_text)

  switch (type) {
    case "paragraph":
      return text + "\n"
    case "heading_1":
      return `# ${text}\n`
    case "heading_2":
      return `## ${text}\n`
    case "heading_3":
      return `### ${text}\n`
    case "bulleted_list_item":
      return `- ${text}\n`
    case "numbered_list_item":
      return `1. ${text}\n`
    case "to_do":
      const checked = data.checked ? "[x]" : "[ ]"
      return `${checked} ${text}\n`
    case "toggle":
      return `> ${text}\n`
    case "code":
      const language = data.language || "text"
      const codeText = extractText(data.rich_text)
      return `\`\`\`${language}\n${codeText}\n\`\`\`\n`
    case "quote":
      return `> ${text}\n`
    case "callout":
      const icon = data.icon?.emoji || "💡"
      return `${icon} ${text}\n`
    case "child_page":
      return `[Page: ${data.title} (ID: ${block.id})]\n`
    case "child_database":
      return `[Database: ${data.title} (ID: ${block.id})]\n`
    case "divider":
      return "---\n"
    default:
      return ""
  }
}

export function getNotionTools(token: string): ToolSet {
  return {
    notion_search: tool({
      description: "Search Notion pages and databases by title/keyword.",
      parameters: zodSchema(
        z.object({
          query: z.string().describe("The search query matching titles of pages or databases."),
          pageSize: z.number().optional().default(10).describe("Number of results to return (max 100)."),
        })
      ),
      execute: async ({ query, pageSize }: { query: string; pageSize?: number }) => {
        try {
          const results = await notionRequest("/search", token, {
            method: "POST",
            body: JSON.stringify({
              query,
              page_size: pageSize,
              sort: {
                direction: "descending",
                timestamp: "last_edited_time",
              },
            }),
          })

          return {
            results: (results.results || []).map((item: any) => {
              const isDb = item.object === "database"
              const title = isDb
                ? extractText(item.title)
                : extractText(item.properties?.title?.title || item.properties?.Name?.title || [])
              return {
                id: item.id,
                object: item.object,
                title: title || "Untitled",
                url: item.url,
                lastEditedTime: item.last_edited_time,
              }
            }),
          }
        } catch (error: any) {
          return { error: error.message }
        }
      },
    }),

    notion_get_page: tool({
      description: "Retrieve a Notion page's metadata and formatting content (blocks).",
      parameters: zodSchema(
        z.object({
          pageId: z.string().describe("The unique ID of the Notion page."),
        })
      ),
      execute: async ({ pageId }: { pageId: string }) => {
        try {
          const page = await notionRequest(`/pages/${pageId}`, token)
          const title = extractText(page.properties?.title?.title || page.properties?.Name?.title || [])

          // Fetch blocks
          const blocksResponse = await notionRequest(`/blocks/${pageId}/children?page_size=100`, token)
          const blocks = blocksResponse.results || []
          const markdownContent = blocks.map(formatBlock).join("\n")

          return {
            id: page.id,
            title: title || "Untitled",
            url: page.url,
            content: markdownContent || "This page has no text content.",
          }
        } catch (error: any) {
          return { error: error.message }
        }
      },
    }),

    notion_query_database: tool({
      description: "Query a Notion database to list pages or find specific records.",
      parameters: zodSchema(
        z.object({
          databaseId: z.string().describe("The ID of the Notion database to query."),
          pageSize: z.number().optional().default(10).describe("Number of results to return."),
        })
      ),
      execute: async ({ databaseId, pageSize }: { databaseId: string; pageSize?: number }) => {
        try {
          const db = await notionRequest(`/databases/${databaseId}`, token)
          const dbTitle = extractText(db.title)

          const results = await notionRequest(`/databases/${databaseId}/query`, token, {
            method: "POST",
            body: JSON.stringify({
              page_size: pageSize,
            }),
          })

          return {
            databaseTitle: dbTitle || "Untitled Database",
            pages: (results.results || []).map((page: any) => {
              const title = extractText(page.properties?.title?.title || page.properties?.Name?.title || [])
              return {
                id: page.id,
                title: title || "Untitled Page",
                url: page.url,
                properties: page.properties,
              }
            }),
          }
        } catch (error: any) {
          return { error: error.message }
        }
      },
    }),

    notion_create_page: tool({
      description: "Create a new page in a parent page or database in Notion.",
      parameters: zodSchema(
        z.object({
          parentPageId: z.string().optional().describe("Parent page ID to create this subpage inside."),
          parentDatabaseId: z.string().optional().describe("Parent database ID to create this row/page inside."),
          title: z.string().describe("Title of the page to create."),
          content: z.string().optional().describe("Optional starting markdown content/paragraph for the page."),
        })
      ),
      execute: async ({
        parentPageId,
        parentDatabaseId,
        title,
        content,
      }: {
        parentPageId?: string
        parentDatabaseId?: string
        title: string
        content?: string
      }) => {
        try {
          if (!parentPageId && !parentDatabaseId) {
            throw new Error("Must provide either parentPageId or parentDatabaseId.")
          }

          const parent = parentPageId
            ? { page_id: parentPageId }
            : { database_id: parentDatabaseId }

          // Build title property name (databases typically use Name or title)
          const properties: any = {}
          if (parentDatabaseId) {
            properties.Name = {
              title: [{ text: { content: title } }],
            }
          } else {
            properties.title = {
              title: [{ text: { content: title } }],
            }
          }

          const children = content
            ? [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ type: "text", text: { content } }],
                  },
                },
              ]
            : undefined

          const newPage = await notionRequest("/pages", token, {
            method: "POST",
            body: JSON.stringify({
              parent,
              properties,
              children,
            }),
          })

          return {
            success: true,
            id: newPage.id,
            url: newPage.url,
          }
        } catch (error: any) {
          return { error: error.message }
        }
      },
    }),

    notion_append_content: tool({
      description: "Append standard paragraph text or block elements to a Notion page.",
      parameters: zodSchema(
        z.object({
          pageId: z.string().describe("The ID of the page/block to append content to."),
          content: z.string().describe("The text content to append as a new paragraph."),
        })
      ),
      execute: async ({ pageId, content }: { pageId: string; content: string }) => {
        try {
          await notionRequest(`/blocks/${pageId}/children`, token, {
            method: "PATCH",
            body: JSON.stringify({
              children: [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ type: "text", text: { content } }],
                  },
                },
              ],
            }),
          })
          return { success: true }
        } catch (error: any) {
          return { error: error.message }
        }
      },
    }),
  }
}
