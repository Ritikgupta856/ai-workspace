import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle, Puzzle, XCircle } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeading } from "@/components/ui/page-heading"
import { StatusBadge } from "@/components/common/status-badge"
import { INTEGRATION_STATUS_CONFIG } from "@/lib/constants"
import {
  GitHubColor,
  LinearColor,
  NotionColor,
  FigmaColor,
} from "@/components/landing/brand-logos"
import { formatUpdatedDate } from "@/lib/date"
import { IntegrationConnectButton } from "@/components/integrations/connect-button"

const PROVIDERS = [
  {
    id: "github" as const,
    type: "GITHUB" as const,
    name: "GitHub",
    description: "Repositories, issues, pull requests",
    Logo: GitHubColor,
    note: "Remote MCP only",
    tokenHint: "Requires a GitHub OAuth App with repo + read:user scopes.",
  },
  {
    id: "notion" as const,
    type: "NOTION" as const,
    name: "Notion",
    description: "Pages, databases, specs",
    Logo: NotionColor,
    note: "Remote MCP only",
    tokenHint: "Requires a Notion OAuth integration.",
  },
  {
    id: "linear" as const,
    type: "LINEAR" as const,
    name: "Linear",
    description: "Issues, cycles, projects",
    Logo: LinearColor,
    note: "Remote MCP only",
    tokenHint: "Requires a Linear OAuth application.",
  },
  {
    id: "figma" as const,
    type: "FIGMA" as const,
    name: "Figma",
    description: "Files, frames, comments",
    Logo: FigmaColor,
    note: "Remote MCP only",
    tokenHint: "Requires a Figma OAuth application.",
  },
]

const ERRORS: Record<string, string> = {
  missing_params: "The provider did not return an authorization code.",
  invalid_state: "That authorization link expired. Try connecting again.",
  user_mismatch: "That authorization was started by a different account.",
  forbidden: "You are not a member of that workspace.",
  token_exchange_failed: "Could not exchange the authorization code for a token.",
  unknown_provider: "That integration is not supported.",
  provider_not_configured:
    "This provider's OAuth credentials are not configured on the server.",
}

export default async function IntegrationsPage(props: {
  searchParams?: Promise<{ success?: string; error?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  })

  if (!membership) return <NoWorkspace />

  const integrations = await prisma.integration.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
  })

  const searchParams = await props.searchParams
  const success = searchParams?.success
  const error = searchParams?.error

  const connectedCount = integrations.filter(
    (i) => i.status === "CONNECTED"
  ).length

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeading
        title="Integrations"
        description={`Remote MCP connections available in Synapse. ${connectedCount} of ${PROVIDERS.length} connected.`}
      />

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          Connected successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <XCircle className="size-4 shrink-0" />
          {ERRORS[error] ??
            (error.endsWith("_denied")
              ? "Authorization was denied."
              : "Failed to connect integration. Please try again.")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map(({ id, type, name, description, Logo, note }) => {
          const existing = integrations.find((i) => i.type === type)
          const connected = existing?.status === "CONNECTED"
          const status = connected
            ? INTEGRATION_STATUS_CONFIG.CONNECTED
            : INTEGRATION_STATUS_CONFIG.DISCONNECTED

          return (
            <div
              key={id}
              className="flex flex-col rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card">
                  <Logo className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {description}
                  </p>
                </div>
                <StatusBadge
                  label={status.label}
                  className={status.className}
                  icon={status.icon}
                />
              </div>

              <p className="text-muted-foreground mt-4 min-h-8 text-xs">
                {connected && existing?.name
                  ? existing.name
                  : "Not connected"}
                {connected && existing?.lastSyncAt && (
                  <>
                    <br />
                    Synced {formatUpdatedDate(existing.lastSyncAt.toISOString())}
                  </>
                )}
              </p>
              <p className="text-muted-foreground mt-1 text-[11px] uppercase tracking-[0.18em]">
                {note}
              </p>

              <div className="mt-4 flex justify-end">
                <IntegrationConnectButton
                  provider={id}
                  connected={connected}
                  integrationId={existing?.id}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NoWorkspace() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <Puzzle className="text-muted-foreground/40 size-12" />
      <h2 className="text-lg font-semibold">No Workspace Found</h2>
      <p className="text-muted-foreground text-sm">
        You need to be part of a workspace to manage integrations.
      </p>
    </div>
  )
}
