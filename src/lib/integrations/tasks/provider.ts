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
      "You have access to the workspace's task management system. " +
      "You can list, view, create, and update tasks. " +
      "Tasks have a title, optional description, status (TODO, IN_PROGRESS, IN_REVIEW, DONE), " +
      "priority (LOW, MEDIUM, HIGH, URGENT), assignee, labels, and due date."
    )
  },
}
