"use client"

import { Puzzle } from "lucide-react"

export default function IntegrationsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <Puzzle className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Integrations</h2>
      <p className="text-sm text-muted-foreground">Connect your tools and services.</p>
    </main>
  )
}
