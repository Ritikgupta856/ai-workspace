"use client"

import { useState, useTransition } from "react"
import type { SVGProps } from "react"
import { Check, Loader2, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { type IntegrationStatusKey } from "@/lib/constants"
import { GitHubColor, NotionColor, LinearColor, FigmaColor } from "@/components/landing/brand-logos"
import { IntegrationDetailSheet } from "@/components/integrations/integration-detail-sheet"
import { disconnectIntegration } from "@/app/(dashboard)/integrations/actions"

export interface IntegrationRuntime {
  id: string
  status: IntegrationStatusKey
  accountName: string
  lastSyncAt: string | null
}

export interface IntegrationProvider {
  id: string
  type: "GITHUB" | "NOTION" | "LINEAR" | "FIGMA"
  name: string
  domain: string
  category: string
  description: string
  overview: string
  howItWorks: string
  syncs: string
  Logo: (props: SVGProps<SVGSVGElement>) => React.JSX.Element
}

const PROVIDERS: IntegrationProvider[] = [
  {
    id: "notion",
    type: "NOTION",
    name: "Notion",
    domain: "By Notion.com",
    category: "Collaboration",
    description:
      "Brings your pages, databases, and specs together in one all-in-one workspace.",
    overview:
      "Connect Notion to bring pages, databases, and specs into Synapse alongside the rest of your workspace context.",
    howItWorks:
      "Synapse uses a Notion OAuth integration to read the pages and databases you share with it, keeping specs and docs available without leaving your workspace.",
    syncs: "Pages, databases, specs",
    Logo: NotionColor,
  },
  {
    id: "github",
    type: "GITHUB",
    name: "GitHub",
    domain: "By GitHub.com",
    category: "Development",
    description: "Manages versions with Git, offering code repository hosting for your team.",
    overview:
      "Connect GitHub so Synapse can pull in repositories, issues, and pull requests to keep your workspace in sync with what's shipping.",
    howItWorks:
      "Once connected, Synapse reads from the repositories you grant access to and keeps issues and pull requests linked to your projects. Requires a GitHub OAuth App with repo and read:user scopes.",
    syncs: "Pull requests, issues, commits",
    Logo: GitHubColor,
  },
  {
    id: "linear",
    type: "LINEAR",
    name: "Linear",
    domain: "By Linear.app",
    category: "Development",
    description: "Helps engineering teams plan, track, and ship work through issues and cycles.",
    overview:
      "Connect Linear to track issues, cycles, and projects directly inside Synapse.",
    howItWorks:
      "Synapse authenticates with a Linear OAuth application to read issues, cycles, and project data for the teams you grant access to.",
    syncs: "Issues, cycles, projects",
    Logo: LinearColor,
  },
  {
    id: "figma",
    type: "FIGMA",
    name: "Figma",
    domain: "By Figma.com",
    category: "Design",
    description: "A collaborative design tool for creating and sharing files, frames, and comments.",
    overview:
      "Connect Figma so designs, frames, and comments stay linked to the work happening in Synapse.",
    howItWorks:
      "Synapse uses a Figma OAuth application to read the files and comments you grant access to, keeping design context close to your projects.",
    syncs: "Files, frames, comments",
    Logo: FigmaColor,
  },
]

function ConnectButton({
  provider,
  connected,
  integrationId,
}: {
  provider: string
  connected: boolean
  integrationId?: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      aria-label={connected ? "Disconnect" : "Connect"}
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation()
        if (isPending) return
        if (connected) {
          if (!integrationId) return
          const formData = new FormData()
          formData.set("id", integrationId)
          startTransition(() => disconnectIntegration(formData))
          return
        }
        window.location.href = `/api/integrations/connect/${provider}`
      }}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
        connected
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        isPending && "opacity-60"
      )}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : connected ? (
        <Check className="size-3.5" />
      ) : (
        <Plus className="size-3.5" />
      )}
    </button>
  )
}

export function IntegrationsView({
  runtimes,
}: {
  runtimes: Record<string, IntegrationRuntime>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedProvider = PROVIDERS.find((p) => p.id === selectedId) ?? null
  const selectedRuntime = selectedProvider ? runtimes[selectedProvider.type] : undefined

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((provider) => {
          const runtime = runtimes[provider.type]
          const connected = runtime?.status === "CONNECTED"
          const Logo = provider.Logo

          return (
            <div
              key={provider.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(provider.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedId(provider.id)
                }
              }}
              className="flex cursor-pointer flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-sm transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted/60">
                  <Logo className="size-6" />
                </div>
                <ConnectButton
                  provider={provider.id}
                  connected={connected}
                  integrationId={runtime?.id}
                />
              </div>

              <div>
                <p className="text-sm font-semibold">{provider.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{provider.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <IntegrationDetailSheet
        provider={selectedProvider}
        runtime={selectedRuntime}
        open={selectedProvider !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </>
  )
}
