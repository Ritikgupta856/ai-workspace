import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PROVIDER_OAUTH: Record<
  string,
  {
    authUrl: string
    clientIdEnv: string
    scope: string
  }
> = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    clientIdEnv: "GITHUB_CLIENT_ID",
    scope: "repo read:user read:org",
  },
  notion: {
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    clientIdEnv: "NOTION_CLIENT_ID",
    scope: "",
  },
  linear: {
    authUrl: "https://linear.app/oauth/authorize",
    clientIdEnv: "LINEAR_CLIENT_ID",
    scope: "read write",
  },
  figma: {
    authUrl: "https://www.figma.com/oauth",
    clientIdEnv: "FIGMA_CLIENT_ID",
    scope: "file_read",
  },
}

function buildState(payload: Record<string, string>) {
  const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? ""
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac("sha256", secret).update(data).digest("hex")
  return Buffer.from(JSON.stringify({ data, sig })).toString("base64url")
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  const config = PROVIDER_OAUTH[provider]
  if (!config) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return NextResponse.json(
      { error: `${config.clientIdEnv} is not configured` },
      { status: 500 }
    )
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL!))
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const redirectUri = `${appUrl}/api/integrations/callback/${provider}`

  const state = buildState({
    userId: session.user.id,
    workspaceId: membership.workspaceId,
  })

  const url = new URL(config.authUrl)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  if (config.scope) url.searchParams.set("scope", config.scope)

  // Notion also needs owner=user
  if (provider === "notion") {
    url.searchParams.set("owner", "user")
  }

  return NextResponse.redirect(url.toString())
}
