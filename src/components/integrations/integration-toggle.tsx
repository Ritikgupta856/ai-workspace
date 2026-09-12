"use client"

import { useTransition } from "react"

import { Switch } from "@/components/ui/switch"
import { disconnectIntegration } from "@/app/(dashboard)/integrations/actions"

interface Props {
  provider: string
  connected: boolean
  integrationId?: string
}

export function IntegrationToggle({ provider, connected, integrationId }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <Switch
      checked={connected}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onCheckedChange={(checked) => {
        if (checked) {
          window.location.href = `/api/integrations/connect/${provider}`
          return
        }
        if (integrationId) {
          const formData = new FormData()
          formData.set("id", integrationId)
          startTransition(() => disconnectIntegration(formData))
        }
      }}
    />
  )
}
