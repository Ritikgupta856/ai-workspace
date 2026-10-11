"use client"

import * as React from "react"
import { toast } from "sonner"

import { IntegrationsSkeleton } from "@/components/dashboard/loading-states"
import { IntegrationsView, type IntegrationRuntime } from "@/components/integrations/integrations-view"
import { useIntegrations } from "@/lib/query/integrations"

const NO_RUNTIMES: Record<string, IntegrationRuntime> = {}

export function IntegrationsPanel() {
  const { data: runtimes = NO_RUNTIMES, isPending, error } = useIntegrations()

  React.useEffect(() => {
    if (error) toast.error(error.message || "Failed to load integrations")
  }, [error])

  return (
    <div className="flex flex-col">
      <h2 className="text-[15px] font-semibold tracking-tight">Integrations</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        Connect GitHub, Linear, Notion and more to your workspace.
      </p>

      {isPending ? <IntegrationsSkeleton count={4} /> : <IntegrationsView runtimes={runtimes} />}
    </div>
  )
}
