import type { Tool } from "ai"
import { createProjectTools } from "./tools"
import type { IntegrationProvider } from "../types"

export const projectsProvider: IntegrationProvider = {
  type: "PROJECTS",

  async isAvailable(_workspaceId: string): Promise<boolean> {
    return true
  },

  async getTools(workspaceId: string): Promise<Record<string, Tool>> {
    return createProjectTools(workspaceId) as Record<string, Tool>
  },

  getSystemPrompt(): string {
    return (
      "**Projects** (this workspace) — list, read, create, update and delete. " +
      "A project has a name, optional description and its own tasks. " +
      "Confirm with the user before writing or deleting; read freely."
    )
  },
}
