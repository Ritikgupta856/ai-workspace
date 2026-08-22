import { NextResponse } from "next/server"
import crypto from "crypto"

import { prisma } from "@/lib/prisma"

const TOKEN_ENDPOINTS: Record<
  string,
  {
    tokenUrl: string
    clientIdEnv: string
    clientSecretEnv: string
    nameField: string[]
    tokenField: string
    refreshField?: string
  }
> = {
  github: {
    tokenUrl: "https://github.com/login/oauth/access_token",
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
    nameField: ["login"],
    tokenField: "access_token",
  },
  notion: {
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    clientIdEnv: "NOTION_CLIENT_ID",
    clientSecretEnv: "NOTION_CLIENT_SECRET",
    nameField: ["owner", "user", "name"],
    tokenField: "access_token",
  },
  linear: {
    tokenUrl: "https://api.linear.app/oauth/token",
    clientIdEnv: "LINEAR_CLIENT_ID",
    clientSecretEnv: "LINEAR_CLIENT_SECRET",
    nameField: ["actor", "name"],
    tokenField: "access_token",
    refreshField: "refresh_token",
  },
  figma: {
    tokenUrl: "https://api.figma.com/v1/oauth/token",
    clientIdEnv: "FIGMA_CLIENT_ID",
    clientSecretEnv: "FIGMA_CLIENT_SECRET",
    nameField: ["user_id"],
    tokenField: "access_token",
    refreshField: "refresh_token",
  },
}

const PROVIDER_NAME_FETCHERS: Record<
  string,
  (token: string) => Promise<string>
> = {
  github: async (token) => {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    })
    const data = (await res.json()) as { login?: string; name?: string }
    return data.name ?? data.login ?? "GitHub"
  },
  notion: async (token) => {
    const res = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
      },
    })
    const data = (await res.json()) as { name?: string }
    return data.name ?? "Notion"
  },
  linear: async (token) => {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "{ viewer { name } }" }),
    })
    const data = (await res.json()) as {
      data?: { viewer?: { name?: string } }
    }
    return data?.data?.viewer?.name ?? "Linear"
  },
  figma: async (token) => {
    const res = await fetch("https://api.figma.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as { handle?: string; email?: string }
    return data.handle ?? data.email ?? "Figma"
  },
}

function verifyState(stateB64: string): {
  userId: string
  workspaceId: string
} | null {
  try {
    const secret =
      process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? ""
    const { data, sig } = JSON.parse(
      Buffer.from(stateB64, "base64url").toString()
    ) as { data: string; sig: string }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("hex")
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null
    }
    return JSON.parse(data) as { userId: string; workspaceId: string }
  } catch {
    return null
  }
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL!

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const stateParam = searchParams.get("state")
  const error = searchParams.get("error")

  const redirectBase = `${appUrl()}/integrations`

  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=${error}_denied`)
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${redirectBase}?error=missing_params`)
  }

  const state = verifyState(stateParam)
  if (!state) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  const config = TOKEN_ENDPOINTS[provider]
  if (!config) {
    return NextResponse.redirect(`${redirectBase}?error=unknown_provider`)
  }

  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${redirectBase}?error=provider_not_configured`)
  }

  const redirectUri = `${appUrl()}/api/integrations/callback/${provider}`

  // Exchange code for token
  let tokenData: Record<string, unknown>
  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    })

    // Notion uses Basic auth
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    }
    if (provider === "notion") {
      headers["Authorization"] =
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      headers["Content-Type"] = "application/json"
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body:
        provider === "notion"
          ? JSON.stringify({
              code,
              grant_type: "authorization_code",
              redirect_uri: redirectUri,
            })
          : body,
    })

    tokenData = (await tokenRes.json()) as Record<string, unknown>
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=token_exchange_failed`)
  }

  const accessToken = tokenData[config.tokenField] as string | undefined
  if (!accessToken) {
    return NextResponse.redirect(`${redirectBase}?error=token_exchange_failed`)
  }

  const refreshToken = config.refreshField
    ? (tokenData[config.refreshField] as string | undefined)
    : undefined

  // Fetch the user's name from the provider
  let name = provider.charAt(0).toUpperCase() + provider.slice(1)
  try {
    const fetcher = PROVIDER_NAME_FETCHERS[provider]
    if (fetcher) name = await fetcher(accessToken)
  } catch {
    // fallback to provider name
  }

  // Upsert integration
  const type = provider.toUpperCase() as
    | "GITHUB"
    | "NOTION"
    | "LINEAR"
    | "FIGMA"

  const existing = await prisma.integration.findFirst({
    where: { workspaceId: state.workspaceId, type },
  })

  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: {
        accessToken,
        refreshToken: refreshToken ?? null,
        name,
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    })
  } else {
    await prisma.integration.create({
      data: {
        workspaceId: state.workspaceId,
        type,
        name,
        accessToken,
        refreshToken: refreshToken ?? null,
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    })
  }

  return NextResponse.redirect(`${redirectBase}?success=true`)
}
