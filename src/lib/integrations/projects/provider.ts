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
      "You have access to the workspace's projects. " +
      "You can list, view, create, update, and delete projects. " +
      "Projects have a name and optional description, and can contain tasks."
    )
  },
}
