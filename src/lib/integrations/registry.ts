import { githubProvider } from "./github/provider"
import { slackProvider } from "./slack/provider"
import { notionProvider } from "./notion/provider"
import { linearProvider } from "./linear/provider"
import { figmaProvider } from "./figma/provider"
import { tasksProvider } from "./tasks/provider"
import { notesProvider } from "./notes/provider"
import { projectsProvider } from "./projects/provider"
import { knowledgeProvider } from "./knowledge/provider"
import type { IntegrationProvider, ProviderContext } from "./types"

export const providers: IntegrationProvider[] = [
  githubProvider,
  slackProvider,
  notionProvider,
  linearProvider,
  figmaProvider,
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
      // One provider failing to resolve — a revoked token, a stale client, a
      // provider that isn't reachable — used to reject the whole Promise.all
      // and 500 the chat. Drop that provider for this turn instead: the user
      // gets a slightly smaller tool set rather than no answer at all.
      try {
        const available = await p.isAvailable(workspaceId)
        if (!available) return null
        const [tools, systemPrompt] = await Promise.all([
          p.getTools(workspaceId, context),
          Promise.resolve(p.getSystemPrompt()),
        ])
        return { tools, systemPrompt }
      } catch (err) {
        console.error(`[integrations] provider ${p.type} unavailable:`, err)
        return null
      }
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
