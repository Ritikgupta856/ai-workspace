"use client"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/common/status-badge"
import { IntegrationConnectButton } from "@/components/integrations/connect-button"
import { IntegrationToggle } from "@/components/integrations/integration-toggle"
import { formatUpdatedDate } from "@/lib/date"
import { INTEGRATION_STATUS_CONFIG } from "@/lib/constants"
import type { IntegrationProvider, IntegrationRuntime } from "./integrations-view"

interface Props {
  provider: IntegrationProvider | null
  runtime: IntegrationRuntime | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IntegrationDetailSheet({ provider, runtime, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {provider && (
          <>
            <SheetTitle className="sr-only">{provider.name} integration</SheetTitle>

            <div className="border-b px-6 py-4 text-sm text-muted-foreground">
              Integrations / <span className="font-medium text-foreground">{provider.name}</span>
            </div>

            <div className="flex flex-col gap-6 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-card">
                    <provider.Logo className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.domain}</p>
                  </div>
                </div>
                <IntegrationConnectButton
                  provider={provider.id}
                  connected={runtime?.status === "CONNECTED"}
                  integrationId={runtime?.id}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium uppercase tracking-wide"
                >
                  {provider.category}
                </Badge>
                <StatusBadge
                  label={INTEGRATION_STATUS_CONFIG[runtime?.status ?? "DISCONNECTED"].label}
                  className={INTEGRATION_STATUS_CONFIG[runtime?.status ?? "DISCONNECTED"].className}
                  icon={INTEGRATION_STATUS_CONFIG[runtime?.status ?? "DISCONNECTED"].icon}
                />
              </div>

              <p className="text-sm text-muted-foreground">{provider.description}</p>

              <div className="flex h-32 items-center justify-center rounded-xl bg-muted">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-md">
                  <provider.Logo className="size-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Overview</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {provider.overview}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">How it works</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {provider.howItWorks}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Enable {provider.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {runtime?.status === "CONNECTED"
                        ? `Connected as ${runtime.accountName}`
                        : `Turn this on to connect your ${provider.name} account.`}
                    </p>
                  </div>
                  <IntegrationToggle
                    provider={provider.id}
                    connected={runtime?.status === "CONNECTED"}
                    integrationId={runtime?.id}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Synced data</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{provider.syncs}</p>
                  </div>
                </div>

                {runtime?.status === "CONNECTED" && runtime.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced {formatUpdatedDate(runtime.lastSyncAt)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
