import type { Tool } from "ai"
import { createNoteTools } from "./tools"
import type { IntegrationProvider, ProviderContext } from "../types"

export const notesProvider: IntegrationProvider = {
  type: "NOTES",

  async isAvailable(_workspaceId: string): Promise<boolean> {
    return true
  },

  async getTools(workspaceId: string, context?: ProviderContext): Promise<Record<string, Tool>> {
    return createNoteTools(workspaceId, context?.userId) as Record<string, Tool>
  },

  getSystemPrompt(): string {
    return (
      "You have access to the workspace's notes. " +
      "You can list, view, create, update, and delete notes. " +
      "Notes have a title, content (markdown-like text), tags, and can be pinned."
    )
  },
}
