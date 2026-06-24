"use client"

import { CheckSquare } from "lucide-react"

export default function TasksPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <CheckSquare className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Tasks</h2>
      <p className="text-sm text-muted-foreground">Manage your tasks and track progress.</p>
    </main>
  )
}
