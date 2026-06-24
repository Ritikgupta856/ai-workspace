"use client"

import { ArrowLeftRight } from "lucide-react"

export default function WorkflowsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <ArrowLeftRight className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Workflows</h2>
      <p className="text-sm text-muted-foreground">Automate your AI workflows.</p>
    </main>
  )
}
