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
      "**Notes** (this workspace) — list, read, create, update and delete. " +
      "Fields: title, markdown content, tags, pinned. " +
      "Confirm with the user before writing or deleting; read freely."
    )
  },
}
