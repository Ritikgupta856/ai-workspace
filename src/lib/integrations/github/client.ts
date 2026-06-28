import { Octokit } from "@octokit/rest"

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!

export function getGitHubOAuthUrl(workspaceId: string, userId: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`
  const state = Buffer.from(JSON.stringify({ workspaceId, userId })).toString("base64")
  const url = new URL("https://github.com/login/oauth/authorize")
  url.searchParams.set("client_id", GITHUB_CLIENT_ID)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", "repo read:org user")
  url.searchParams.set("state", state)
  return url.toString()
}

export async function exchangeGitHubCode(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
    token_type?: string
    error?: string
    error_description?: string
  }>
}

export function createGitHubClient(accessToken: string) {
  return new Octokit({ auth: accessToken })
}
