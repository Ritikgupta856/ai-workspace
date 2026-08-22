import { createMCPClient } from "@ai-sdk/mcp"
import type { ToolSet } from "ai"

import { hasValidConnection, getAccessToken } from "./auth"
import { INTEGRATIONS } from "./config"

type ConnectedClient = Awaited<ReturnType<typeof createMCPClient>>

type WorkspaceToolContext = {
  userId?: string
}

function toTransportType(transportType: "sse" | "streamable-http") {
  return transportType === "streamable-http" ? "http" : "sse"
}

export async function getMergedToolsForWorkspace(
  workspaceId: string,
  _context?: WorkspaceToolContext
) {
  void _context

  const merged: ToolSet = {}
  const clients: ConnectedClient[] = []
  const instructions: string[] = []

  for (const integration of INTEGRATIONS) {
    try {
      const available = await hasValidConnection(workspaceId, integration.id)
      if (!available) continue

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

      const tools = await client.tools()
      Object.assign(merged, tools)

      if (client.instructions) {
        instructions.push(client.instructions)
      }
    } catch (error) {
      console.error(`[integrations] ${integration.id} failed:`, error)
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

