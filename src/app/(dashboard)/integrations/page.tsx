import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getGitHubOAuthUrl } from "@/lib/integrations/github/client"
import { redirect } from "next/navigation"
import { Puzzle, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { PageHeading } from "@/components/ui/page-heading"
import { StatusBadge } from "@/components/common/status-badge"
import { INTEGRATION_STATUS_CONFIG } from "@/lib/constants"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

export default async function IntegrationsPage(props: {
  searchParams?: Promise<{ success?: string; error?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  })

  if (!membership) {
    return <NoWorkspace />
  }

  const integrations = await prisma.integration.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
  })

  const githubOAuthUrl = getGitHubOAuthUrl(
    membership.workspaceId,
    session.user.id
  )

  const searchParams = await props.searchParams
  const success = searchParams?.success
  const error = searchParams?.error

  const existingGithub = integrations.find((i) => i.type === "GITHUB")

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeading
        title="Integrations"
        description="Connect your tools and services to Synapse."
      />

      {/* Toast-like feedback */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="size-4 shrink-0" />
          {success === "github"
            ? "GitHub connected successfully."
            : "Integration connected."}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" />
          {error === "github_denied"
            ? "GitHub authorization was denied."
            : "Failed to connect integration. Please try again."}
        </div>
      )}

      {/* Integration cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* GitHub */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <GithubIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">GitHub</p>
              <p className="text-xs text-muted-foreground">
                Repositories, issues, pull requests
              </p>
            </div>
            {existingGithub ? (
              <StatusBadge
                label={INTEGRATION_STATUS_CONFIG.CONNECTED.label}
                className={INTEGRATION_STATUS_CONFIG.CONNECTED.className}
                icon={INTEGRATION_STATUS_CONFIG.CONNECTED.icon}
              />
            ) : (
              <StatusBadge
                label={INTEGRATION_STATUS_CONFIG.DISCONNECTED.label}
                className={INTEGRATION_STATUS_CONFIG.DISCONNECTED.className}
                icon={INTEGRATION_STATUS_CONFIG.DISCONNECTED.icon}
              />
            )}
          </div>

          {existingGithub ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Connected as</span>
                <span className="font-medium text-foreground">
                  {existingGithub.name?.replace("GitHub (", "").replace(")", "")}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={githubOAuthUrl}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Reconnect
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Link
                href={githubOAuthUrl}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
              >
                <GithubIcon className="size-4" />
                Connect GitHub
              </Link>
            </div>
          )}
        </div>

        {/* Placeholder cards for other integrations */}
        {(["Linear", "Notion", "Slack"] as const).map((name) => {
          const type = name.toUpperCase() as "LINEAR" | "NOTION" | "SLACK"
          const existing = integrations.find((i) => i.type === type)

          return (
            <div
              key={name}
              className="rounded-xl border bg-card p-5 shadow-sm opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <ExternalLink className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
                {existing ? (
                  <StatusBadge
                    label={INTEGRATION_STATUS_CONFIG.CONNECTED.label}
                    className={INTEGRATION_STATUS_CONFIG.CONNECTED.className}
                    icon={INTEGRATION_STATUS_CONFIG.CONNECTED.icon}
                  />
                ) : (
                  <StatusBadge
                    label={INTEGRATION_STATUS_CONFIG.DISCONNECTED.label}
                    className={INTEGRATION_STATUS_CONFIG.DISCONNECTED.className}
                    icon={INTEGRATION_STATUS_CONFIG.DISCONNECTED.icon}
                  />
                )}
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
      <Puzzle className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">No Workspace Found</h2>
      <p className="text-sm text-muted-foreground">
        You need to be part of a workspace to manage integrations.
      </p>
    </div>
  )
}
