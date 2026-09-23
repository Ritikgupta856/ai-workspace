import { createMCPClient } from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

import { hasValidConnection, getAccessToken } from "./auth"
import { INTEGRATIONS } from "./config"

type ConnectedClient = Awaited<ReturnType<typeof createMCPClient>>

type WorkspaceToolContext = {
  userId?: string
  /** Integration ids to connect; omit for every connected integration. */
  only?: string[]
}

function toTransportType(transportType: "sse" | "streamable-http") {
  return transportType === "streamable-http" ? "http" : "sse"
}

export async function getMergedToolsForWorkspace(
  workspaceId: string,
  context?: WorkspaceToolContext
) {
  const merged: ToolSet = {}
  const clients: ConnectedClient[] = []
  const instructions: string[] = []

  const selected = context?.only
    ? INTEGRATIONS.filter((integration) => context.only!.includes(integration.id))
    : INTEGRATIONS

  // Connect in parallel — sequential handshakes made every chat turn wait for
  // the sum of all servers' latency before the model could start.
  const connected = await Promise.all(
    selected.map(async (integration) => {
      try {
        const available = await hasValidConnection(workspaceId, integration.id)
        if (!available) return null

        const token = await getAccessToken(workspaceId, integration.id)

        const client = await createMCPClient({
          transport: {
            type: toTransportType(integration.transportType),
            url: integration.mcpUrl,
            headers: {
              Authorization: `Bearer ${token}`,
            },
            redirect: "error",
          },
        })

        clients.push(client)

        return { tools: await client.tools(), instructions: client.instructions }
      } catch (error) {
        console.error(`[integrations] ${integration.id} failed:`, error)
        return null
      }
    })
  )

  // Merge in config order so tool-name collisions resolve the same way
  // regardless of which server answered first.
  for (const result of connected) {
    if (!result) continue
    Object.assign(merged, result.tools)
    if (result.instructions) {
      instructions.push(result.instructions)
    }
  }

  return {
    tools: Object.keys(merged).length > 0 ? merged : undefined,
    systemPrompt: instructions.length > 0 ? instructions.join("\n\n") : undefined,
    cleanup: async () => {
      await Promise.allSettled(clients.map((client) => client.close()))
    },
  }
}

export async function resolveWorkspaceTools(
  workspaceId: string,
  context?: WorkspaceToolContext
) {
  return getMergedToolsForWorkspace(workspaceId, context)
}

