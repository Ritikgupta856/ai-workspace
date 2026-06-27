"use client"

import { FolderKanban, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ProjectEmptyStateProps {
  onCreate: () => void
}

export function ProjectEmptyState({ onCreate }: ProjectEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FolderKanban className="size-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">No projects yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create your first project to organize chats, tasks, documents,
          knowledge, and integrations.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="size-4" />
        Create Project
      </Button>
    </div>
  )
}
