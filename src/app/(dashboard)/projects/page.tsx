"use client"

import { FolderOpenIcon } from "@phosphor-icons/react"

export default function ProjectsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <FolderOpenIcon className="size-12 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Projects</h2>
      <p className="text-sm text-muted-foreground">Manage your projects.</p>
    </main>
  )
}
