import { tool } from "ai"
import { z } from "zod"
import { searchKnowledge } from "@/lib/knowledge/ingest"

export function createKnowledgeTools(workspaceId: string) {
  return {
    searchKnowledge: tool({
      description: "Search the workspace knowledge base for relevant information from documents, notes, and other sources. Use this when the user asks questions about their uploaded documents or stored knowledge.",
      inputSchema: z.object({
        query: z.string().describe("The search query to find relevant knowledge"),
        limit: z.number().min(1).max(20).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        console.log(`[RAG] 🛠️ Tool "searchKnowledge" called: query="${query.slice(0, 80)}" limit=${limit}`)
        const results = await searchKnowledge(workspaceId, query, limit)
        const mapped = results.map((r) => ({
          content: r.content,
          title: r.title,
          sourceType: r.sourceType,
          relevance: Math.round(r.similarity * 100),
        }))
        console.log(`[RAG] 🛠️ Tool "searchKnowledge" returning ${mapped.length} results`)
        return mapped
      },
    }),
  }
}
