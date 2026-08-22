import type { IntegrationType } from "@/generated/prisma/client"

import { prisma } from "@/lib/prisma"

function toIntegrationType(providerId: string) {
  return providerId.toUpperCase() as IntegrationType
}

export async function hasValidConnection(
  workspaceId: string,
  providerId: string
) {
  const integration = await prisma.integration.findFirst({
    where: {
      workspaceId,
      type: toIntegrationType(providerId),
      status: "CONNECTED",
      accessToken: { not: null },
    },
    select: { id: true },
  })

  return Boolean(integration)
}

export async function getAccessToken(
  workspaceId: string,
  providerId: string
) {
  const integration = await prisma.integration.findFirst({
    where: {
      workspaceId,
      type: toIntegrationType(providerId),
      status: "CONNECTED",
      accessToken: { not: null },
    },
    select: { accessToken: true },
  })

  if (!integration?.accessToken) {
    throw new Error(`No access token stored for ${providerId}`)
  }

  return integration.accessToken
}
