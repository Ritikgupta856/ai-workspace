import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { callbackUrl, decodeState, getProvider } from "@/lib/integrations/oauth"

function fail(req: Request, reason: string) {
  return NextResponse.redirect(
    new URL(`/integrations?error=${reason}`, req.url)
  )
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await ctx.params
  const provider = getProvider(providerId)

  if (!provider) return fail(req, "unknown_provider")

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const denied = searchParams.get("error")

  if (denied) return fail(req, `${provider.id}_denied`)
  if (!code || !state) return fail(req, "missing_params")

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/sign-in?redirect=/integrations", req.url)
    )
  }

  let statePayload: { workspaceId: string; userId: string }
  try {
    statePayload = decodeState(state)
  } catch {
    return fail(req, "invalid_state")
  }

  if (statePayload.userId !== session.user.id) {
    return fail(req, "user_mismatch")
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspaceId: statePayload.workspaceId,
    },
  })
  if (!membership) return fail(req, "forbidden")

  let token
  let identity
  try {
    const result = await provider.exchange(code, callbackUrl(provider.id))
    if (!result.accessToken) return fail(req, "token_exchange_failed")
    token = { accessToken: result.accessToken, refreshToken: result.refreshToken }
    identity = await provider.identity(token, result.raw)
  } catch {
    return fail(req, "token_exchange_failed")
  }

  const existing = await prisma.integration.findFirst({
    where: { workspaceId: statePayload.workspaceId, type: provider.type },
  })

  const data = {
    name: identity.name,
    status: "CONNECTED" as const,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    metadata: identity.metadata as object,
    lastSyncAt: new Date(),
  }

  if (existing) {
    await prisma.integration.update({ where: { id: existing.id }, data })
  } else {
    await prisma.integration.create({
      data: {
        workspaceId: statePayload.workspaceId,
        type: provider.type,
        ...data,
      },
    })
  }

  await logActivity({
    type: "INTEGRATION_CONNECTED",
    workspaceId: statePayload.workspaceId,
    userId: statePayload.userId,
    metadata: { target: identity.name, integration: provider.label },
  })

  return NextResponse.redirect(
    new URL(`/integrations?success=${provider.id}`, req.url)
  )
}
