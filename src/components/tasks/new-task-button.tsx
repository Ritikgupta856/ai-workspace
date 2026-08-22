"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface NewTaskButtonProps {
  onNewTask: () => void
}

export function NewTaskButton({ onNewTask }: NewTaskButtonProps) {
  return (
    <Button size="sm" onClick={onNewTask}>
      <Plus className="size-4" />
      <span>New task</span>
    </Button>
  )
}
