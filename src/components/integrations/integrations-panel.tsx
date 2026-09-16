"use client"

import * as React from "react"
import { toast } from "sonner"

import { IntegrationsSkeleton } from "@/components/dashboard/loading-states"
import { IntegrationsView, type IntegrationRuntime } from "@/components/integrations/integrations-view"

export function IntegrationsPanel() {
  const [loading, setLoading] = React.useState(true)
  const [runtimes, setRuntimes] = React.useState<Record<string, IntegrationRuntime>>({})

  React.useEffect(() => {
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRuntimes(json.runtimes)
        } else {
          toast.error(json.error || "Failed to load integrations")
        }
      })
      .catch(() => toast.error("Failed to load integrations"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-semibold tracking-tight">Integrations</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        Connect GitHub, Linear, Notion and more to your workspace.
      </p>

      {loading ? (
        <IntegrationsSkeleton count={4} />
      ) : (
        <IntegrationsView runtimes={runtimes} />
      )}
    </div>
  )
}
