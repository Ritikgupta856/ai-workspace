"use client"

import { useTransition } from "react"
import { Loader2, Link2, Link2Off } from "lucide-react"

import { Button } from "@/components/ui/button"
import { disconnectIntegration } from "@/app/(dashboard)/integrations/actions"

interface Props {
  provider: string
  connected: boolean
  integrationId?: string
}

export function IntegrationConnectButton({
  provider,
  connected,
  integrationId,
}: Props) {
  const [isPending, startTransition] = useTransition()

  if (connected && integrationId) {
    return (
      <form
        action={disconnectIntegration}
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(() =>
            disconnectIntegration(new FormData(e.currentTarget))
          )
        }}
      >
        <input type="hidden" name="id" value={integrationId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Link2Off className="size-3.5" />
          )}
          Disconnect
        </Button>
      </form>
    )
  }

  return (
    <Button
      size="sm"
      className="gap-1.5"
      onClick={() => {
        window.location.href = `/api/integrations/connect/${provider}`
      }}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Link2 className="size-3.5" />
      )}
      Connect
    </Button>
  )
}
