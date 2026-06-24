"use client"

import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <Settings className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Settings</h2>
      <p className="text-sm text-muted-foreground">Manage your workspace settings.</p>
    </main>
  )
}
