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
      "**Knowledge base** (this workspace) — semantic search over uploaded documents, notes and ingested sources. " +
      "Relevant excerpts are often already provided below; call `searchKnowledge` when they are thin, " +
      "when the question shifts topic mid-conversation, or to confirm a detail before asserting it. " +
      "Cite excerpts by their title."
    )
  },
}
