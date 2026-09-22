"use client"

import { CircleCheck } from "lucide-react"

import { TasksView } from "@/components/tasks/tasks-view"
import {
  HeaderPrimaryButton,
  SectionHeader,
} from "@/components/dashboard/section-header"

/**
 * View switching and search live in the toolbar TasksView renders directly
 * below this header, so they are deliberately not repeated up here.
 */
export default function MyWorkPage() {
  return (
    <TasksView
      assignedToMe
      showPageHeader={false}
      header={(controls) => (
        <SectionHeader icon={CircleCheck} title="My work">
          <HeaderPrimaryButton onClick={controls.openCreate}>Add</HeaderPrimaryButton>
        </SectionHeader>
      )}
    />
  )
}
