"use client"

import { useParams } from "next/navigation"

export default function IntegrationDetailPage() {
  const { integrationId } = useParams<{ integrationId: string }>()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="text-sm text-muted-foreground">Integration {integrationId}</div>
    </main>
  )
}
