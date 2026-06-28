import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { exchangeGitHubCode } from "@/lib/integrations/github/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL("/integrations?error=github_denied", req.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/integrations?error=missing_params", req.url)
    )
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/sign-in?redirect=/integrations", req.url)
    )
  }

  let statePayload: { workspaceId: string; userId: string }
  try {
    statePayload = JSON.parse(Buffer.from(state, "base64").toString())
  } catch {
    return NextResponse.redirect(
      new URL("/integrations?error=invalid_state", req.url)
    )
  }

  if (statePayload.userId !== session.user.id) {
    return NextResponse.redirect(
      new URL("/integrations?error=user_mismatch", req.url)
    )
  }

  const tokenData = await exchangeGitHubCode(code)

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      new URL("/integrations?error=token_exchange_failed", req.url)
    )
  }

  const { Octokit } = await import("@octokit/rest")
  const octokit = new Octokit({ auth: tokenData.access_token })
  const { data: ghUser } = await octokit.rest.users.getAuthenticated()

  const existing = await prisma.integration.findFirst({
    where: {
      workspaceId: statePayload.workspaceId,
      type: "GITHUB",
    },
  })

  const metadata = {
    login: ghUser.login,
    avatarUrl: ghUser.avatar_url,
    githubId: ghUser.id,
  }

  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: {
        name: `GitHub (${ghUser.login})`,
        status: "CONNECTED",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        metadata,
      },
    })
  } else {
    await prisma.integration.create({
      data: {
        workspaceId: statePayload.workspaceId,
        type: "GITHUB",
        name: `GitHub (${ghUser.login})`,
        status: "CONNECTED",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        metadata,
      },
    })
  }

  return NextResponse.redirect(new URL("/integrations?success=github", req.url))
}
