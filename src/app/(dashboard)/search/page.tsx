"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"

export default function SearchPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <MagnifyingGlassIcon className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Search your workspace</h2>
      <p className="text-sm text-muted-foreground">Search across chats, tasks, projects, and more.</p>
    </main>
  )
}
