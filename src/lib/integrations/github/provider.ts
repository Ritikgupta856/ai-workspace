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
      "**GitHub** — repositories, issues, pull requests, commits, and the code itself.\n" +
      "  - To explore a repository, call `listRepositoryFiles`. It returns the real file tree and is the reliable " +
      "starting point. `searchCode` uses GitHub's search index, which is often empty for small or new repositories — " +
      "an empty result there means the index is thin, not that the repository is empty. Never conclude a repo has no " +
      "code from a failed search; list the tree.\n" +
      "  - Read files with `getFileContent`; pass a directory path and you get its listing back.\n" +
      "  - To review a pull request, use `getPullRequestFiles` for the diffs, not just the PR description.\n" +
      "  - `listCommits` answers what changed recently and who changed it, per repository or per file.\n" +
      "  - Every issue, PR, commit and file has a url — cite it."
    )
  },
}
