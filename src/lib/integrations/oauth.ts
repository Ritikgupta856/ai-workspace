import type { IntegrationType } from "@/generated/prisma/client"

export type ProviderId = "slack" | "notion" | "linear" | "figma"

export type Identity = {
  name: string
  metadata: Record<string, unknown>
}

export type TokenSet = {
  accessToken: string
  refreshToken?: string | null
}

type Provider = {
  id: ProviderId
  type: IntegrationType
  label: string
  clientId: () => string | undefined
  clientSecret: () => string | undefined
  authorizeUrl: (redirectUri: string, state: string) => string
  exchange: (code: string, redirectUri: string) => Promise<TokenSet & { raw: Record<string, unknown> }>
  identity: (
    token: TokenSet,
    raw: Record<string, unknown>
  ) => Promise<Identity>
}

export function callbackUrl(provider: ProviderId) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${provider}/callback`
}

export function encodeState(workspaceId: string, userId: string) {
  return Buffer.from(JSON.stringify({ workspaceId, userId })).toString("base64")
}

export function decodeState(state: string) {
  return JSON.parse(Buffer.from(state, "base64").toString()) as {
    workspaceId: string
    userId: string
  }
}

async function postForm(url: string, body: Record<string, string>, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      ...headers,
    },
    body: new URLSearchParams(body).toString(),
  })
  return (await res.json()) as Record<string, unknown>
}

function basicAuth(id: string, secret: string) {
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`
}

const slack: Provider = {
  id: "slack",
  type: "SLACK",
  label: "Slack",
  clientId: () => process.env.SLACK_CLIENT_ID,
  clientSecret: () => process.env.SLACK_CLIENT_SECRET,
  authorizeUrl: (redirectUri, state) => {
    const url = new URL("https://slack.com/oauth/v2/authorize")
    url.searchParams.set("client_id", process.env.SLACK_CLIENT_ID ?? "")
    url.searchParams.set(
      "scope",
      "channels:read,channels:history,groups:read,users:read,team:read"
    )
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("state", state)
    return url.toString()
  },
  exchange: async (code, redirectUri) => {
    const raw = await postForm("https://slack.com/api/oauth.v2.access", {
      client_id: process.env.SLACK_CLIENT_ID ?? "",
      client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
    })
    if (raw.ok === false) throw new Error(String(raw.error ?? "slack_error"))
    return {
      accessToken: String(raw.access_token ?? ""),
      refreshToken: raw.refresh_token ? String(raw.refresh_token) : null,
      raw,
    }
  },
  identity: async (_token, raw) => {
    const team = raw.team as { id?: string; name?: string } | undefined
    return {
      name: team?.name ? `Slack (${team.name})` : "Slack",
      metadata: { teamId: team?.id, teamName: team?.name, scope: raw.scope },
    }
  },
}

const notion: Provider = {
  id: "notion",
  type: "NOTION",
  label: "Notion",
  clientId: () => process.env.NOTION_CLIENT_ID,
  clientSecret: () => process.env.NOTION_CLIENT_SECRET,
  authorizeUrl: (redirectUri, state) => {
    const url = new URL("https://api.notion.com/v1/oauth/authorize")
    url.searchParams.set("client_id", process.env.NOTION_CLIENT_ID ?? "")
    url.searchParams.set("response_type", "code")
    url.searchParams.set("owner", "user")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("state", state)
    return url.toString()
  },
  exchange: async (code, redirectUri) => {
    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuth(
          process.env.NOTION_CLIENT_ID ?? "",
          process.env.NOTION_CLIENT_SECRET ?? ""
        ),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })
    const raw = (await res.json()) as Record<string, unknown>
    if (raw.error) throw new Error(String(raw.error))
    return {
      accessToken: String(raw.access_token ?? ""),
      refreshToken: null,
      raw,
    }
  },
  identity: async (_token, raw) => {
    const workspaceName = raw.workspace_name ? String(raw.workspace_name) : null
    return {
      name: workspaceName ? `Notion (${workspaceName})` : "Notion",
      metadata: {
        workspaceId: raw.workspace_id,
        workspaceName,
        botId: raw.bot_id,
      },
    }
  },
}

const linear: Provider = {
  id: "linear",
  type: "LINEAR",
  label: "Linear",
  clientId: () => process.env.LINEAR_CLIENT_ID,
  clientSecret: () => process.env.LINEAR_CLIENT_SECRET,
  authorizeUrl: (redirectUri, state) => {
    const url = new URL("https://linear.app/oauth/authorize")
    url.searchParams.set("client_id", process.env.LINEAR_CLIENT_ID ?? "")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("scope", "read")
    url.searchParams.set("state", state)
    return url.toString()
  },
  exchange: async (code, redirectUri) => {
    const raw = await postForm("https://api.linear.app/oauth/token", {
      client_id: process.env.LINEAR_CLIENT_ID ?? "",
      client_secret: process.env.LINEAR_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    })
    if (raw.error) throw new Error(String(raw.error))
    return {
      accessToken: String(raw.access_token ?? ""),
      refreshToken: raw.refresh_token ? String(raw.refresh_token) : null,
      raw,
    }
  },
  identity: async (token) => {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.accessToken,
      },
      body: JSON.stringify({
        query: "{ viewer { id name email } organization { id name } }",
      }),
    })
    const json = (await res.json()) as {
      data?: {
        viewer?: { id: string; name: string; email: string }
        organization?: { id: string; name: string }
      }
    }
    const org = json.data?.organization
    return {
      name: org?.name ? `Linear (${org.name})` : "Linear",
      metadata: {
        organizationId: org?.id,
        organizationName: org?.name,
        userName: json.data?.viewer?.name,
      },
    }
  },
}

const figma: Provider = {
  id: "figma",
  type: "FIGMA",
  label: "Figma",
  clientId: () => process.env.FIGMA_CLIENT_ID,
  clientSecret: () => process.env.FIGMA_CLIENT_SECRET,
  authorizeUrl: (redirectUri, state) => {
    const url = new URL("https://www.figma.com/oauth")
    url.searchParams.set("client_id", process.env.FIGMA_CLIENT_ID ?? "")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("scope", "file_read")
    url.searchParams.set("state", state)
    url.searchParams.set("response_type", "code")
    return url.toString()
  },
  exchange: async (code, redirectUri) => {
    const raw = await postForm(
      "https://api.figma.com/v1/oauth/token",
      {
        redirect_uri: redirectUri,
        code,
        grant_type: "authorization_code",
      },
      {
        Authorization: basicAuth(
          process.env.FIGMA_CLIENT_ID ?? "",
          process.env.FIGMA_CLIENT_SECRET ?? ""
        ),
      }
    )
    if (raw.error) throw new Error(String(raw.message ?? raw.error))
    return {
      accessToken: String(raw.access_token ?? ""),
      refreshToken: raw.refresh_token ? String(raw.refresh_token) : null,
      raw,
    }
  },
  identity: async (token) => {
    const res = await fetch("https://api.figma.com/v1/me", {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    })
    const me = (await res.json()) as {
      id?: string
      handle?: string
      email?: string
    }
    return {
      name: me.handle ? `Figma (${me.handle})` : "Figma",
      metadata: { figmaId: me.id, handle: me.handle, email: me.email },
    }
  },
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  slack,
  notion,
  linear,
  figma,
}

export function getProvider(id: string): Provider | null {
  return PROVIDERS[id as ProviderId] ?? null
}

export function isConfigured(id: ProviderId) {
  const provider = PROVIDERS[id]
  return Boolean(provider.clientId() && provider.clientSecret())
}

export function getAuthorizeUrl(
  id: ProviderId,
  workspaceId: string,
  userId: string
) {
  const provider = PROVIDERS[id]
  return provider.authorizeUrl(
    callbackUrl(id),
    encodeState(workspaceId, userId)
  )
}
