import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle, Puzzle, XCircle } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/dashboard/page-header"
import {

  IntegrationsView,
  type IntegrationRuntime,
} from "@/components/integrations/integrations-view"

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

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect GitHub, Linear, Notion and more to your workspace.",
}

export const instant = false

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

  const runtimes: Record<string, IntegrationRuntime> = {}
  for (const integration of integrations) {
    runtimes[integration.type] = {
      id: integration.id,
      status: integration.status,
      accountName: integration.name,
      lastSyncAt: integration.lastSyncAt ? integration.lastSyncAt.toISOString() : null,
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Integrations" />

      <div className="flex flex-1 flex-col gap-6 p-6">
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

        <IntegrationsView runtimes={runtimes} />
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
