import type { Tool } from "ai"
import { githubProvider } from "./github/provider"
import { tasksProvider } from "./tasks/provider"
import { notesProvider } from "./notes/provider"
import { projectsProvider } from "./projects/provider"
import { knowledgeProvider } from "./knowledge/provider"
import type { IntegrationProvider, ProviderContext } from "./types"

export const providers: IntegrationProvider[] = [
  githubProvider,
  tasksProvider,
  notesProvider,
  projectsProvider,
  knowledgeProvider,
]

export async function resolveWorkspaceTools(
  workspaceId: string,
  context?: ProviderContext
) {
  const results = await Promise.all(
    providers.map(async (p) => {
      const available = await p.isAvailable(workspaceId)
      if (!available) return null
      const [tools, systemPrompt] = await Promise.all([
        p.getTools(workspaceId, context),
        Promise.resolve(p.getSystemPrompt()),
      ])
      return { tools, systemPrompt }
    })
  )

  const activeResults = results.filter(Boolean) as NonNullable<typeof results[number]>[]

  const tools = activeResults.length > 0
    ? Object.assign({}, ...activeResults.map((r) => r.tools))
    : undefined

  const systemPrompt = activeResults.length > 0
    ? activeResults.map((r) => r.systemPrompt).join("\n\n")
    : undefined

  return { tools, systemPrompt }
}
