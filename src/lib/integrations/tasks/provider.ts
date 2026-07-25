import type { Tool } from "ai"
import { createTaskTools } from "./tools"
import type { IntegrationProvider, ProviderContext } from "../types"

export const tasksProvider: IntegrationProvider = {
  type: "TASKS",

  async isAvailable(_workspaceId: string): Promise<boolean> {
    return true
  },

  async getTools(workspaceId: string, context?: ProviderContext): Promise<Record<string, Tool>> {
    return createTaskTools(workspaceId, context?.userId) as Record<string, Tool>
  },

  getSystemPrompt(): string {
    return (
      "**Tasks** (this workspace) — list, read, create and update. " +
      "Fields: title, description, status (TODO, IN_PROGRESS, IN_REVIEW, DONE), " +
      "priority (LOW, MEDIUM, HIGH, URGENT), assignee, labels, due date. " +
      "Confirm the specifics with the user before creating or updating anything; read freely."
    )
  },
}
