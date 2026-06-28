import type { Tool } from "ai"
import { prisma } from "@/lib/prisma"
import { createGitHubClient } from "./client"
import { createGitHubTools } from "./tools"
import type { IntegrationProvider, ProviderContext } from "../types"

export const githubProvider: IntegrationProvider = {
  type: "GITHUB",

  async isAvailable(workspaceId: string): Promise<boolean> {
    const integration = await prisma.integration.findFirst({
      where: {
        workspaceId,
        type: "GITHUB",
        status: "CONNECTED",
      },
      select: { id: true },
    })
    return integration !== null
  },

  async getTools(workspaceId: string, _context?: ProviderContext): Promise<Record<string, Tool>> {
    const integration = await prisma.integration.findFirst({
      where: {
        workspaceId,
        type: "GITHUB",
        status: "CONNECTED",
      },
      select: { accessToken: true },
    })

    if (!integration?.accessToken) return {}

    const octokit = createGitHubClient(integration.accessToken)
    return createGitHubTools(octokit) as Record<string, Tool>
  },

  getSystemPrompt(): string {
    return (
      "You have access to the user's GitHub repositories through the available tools. " +
      "Use them when the user asks about their repos, issues, pull requests, or code. " +
      "You can list repositories, search code, view issues and PRs, read file contents, and more."
    )
  },
}
