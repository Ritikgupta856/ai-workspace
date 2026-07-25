import type { Tool } from "ai"

import { prisma } from "@/lib/prisma"
import type { IntegrationType } from "@/generated/prisma/client"
import type { IntegrationProvider, ProviderContext } from "./types"

export async function getAccessToken(
  workspaceId: string,
  type: IntegrationType
) {
  const integration = await prisma.integration.findFirst({
    where: { workspaceId, type, status: "CONNECTED" },
    select: { accessToken: true },
  })
  return integration?.accessToken ?? null
}

export function createTokenProvider({
  type,
  systemPrompt,
  makeTools,
}: {
  type: IntegrationType
  systemPrompt: string
  makeTools: (accessToken: string) => Record<string, Tool>
}): IntegrationProvider {
  return {
    type,

    async isAvailable(workspaceId: string) {
      return (await getAccessToken(workspaceId, type)) !== null
    },

    async getTools(workspaceId: string, _context?: ProviderContext) {
      const accessToken = await getAccessToken(workspaceId, type)
      if (!accessToken) return {}
      return makeTools(accessToken)
    },

    getSystemPrompt() {
      return systemPrompt
    },
  }
}

export async function apiJson<T>(
  url: string,
  init: RequestInit & { errorLabel: string }
): Promise<T> {
  const { errorLabel, ...rest } = init
  const res = await fetch(url, rest)
  const text = await res.text()

  let body: unknown
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  if (!res.ok) {
    throw new Error(
      `${errorLabel} failed (${res.status}): ${text.slice(0, 300)}`
    )
  }

  return body as T
}
