import type { Tool } from "ai"
import { createKnowledgeTools } from "./tools"
import type { IntegrationProvider, ProviderContext } from "../types"

export const knowledgeProvider: IntegrationProvider = {
  type: "KNOWLEDGE",

  async isAvailable(_workspaceId: string): Promise<boolean> {
    return true
  },

  async getTools(workspaceId: string, _context?: ProviderContext): Promise<Record<string, Tool>> {
    return createKnowledgeTools(workspaceId) as Record<string, Tool>
  },

  getSystemPrompt(): string {
    return (
      "You have access to the workspace knowledge base. " +
      "The knowledge base contains information extracted from uploaded documents and other sources. " +
      "You can search it to answer questions about the workspace's documents and stored knowledge. " +
      "Use `searchKnowledge` when you need to find relevant information to answer the user's question."
    )
  },
}
