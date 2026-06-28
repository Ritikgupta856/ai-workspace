import type { Tool } from "ai"

export interface ProviderContext {
  userId?: string
}

export interface IntegrationProvider {
  type: string
  isAvailable(workspaceId: string): Promise<boolean>
  getTools(workspaceId: string, context?: ProviderContext): Promise<Record<string, Tool>>
  getSystemPrompt(): string
}
