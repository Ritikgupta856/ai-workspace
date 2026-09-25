"use client"

import { CircleCheck } from "lucide-react"

import { TasksView } from "@/components/tasks/tasks-view"
import { SectionHeader } from "@/components/dashboard/section-header"

/**
 * View switching and search live in the toolbar TasksView renders directly
 * below this header, so they are deliberately not repeated up here. My work
 * only lists what's assigned to you; tasks are created inside projects.
 */
export default function MyWorkPage() {
  return (
    <TasksView
      assignedToMe
      showPageHeader={false}
      header={() => <SectionHeader icon={CircleCheck} title="My work" />}
    />
  )
}
