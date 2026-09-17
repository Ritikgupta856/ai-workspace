"use client"

import { CircleCheck, Columns3, List } from "lucide-react"

import { TasksView } from "@/components/tasks/tasks-view"
import {
  HeaderPrimaryButton,
  HeaderSearchButton,
  SectionHeader,
} from "@/components/dashboard/section-header"
import { ViewToggle } from "@/components/common/view-toggle"

export default function MyWorkPage() {
  return (
    <TasksView
      assignedToMe
      showPageHeader={false}
      header={(controls) => (
        <SectionHeader icon={CircleCheck} title="My work">
          <ViewToggle
            className="hidden sm:flex"
            value={controls.viewMode}
            options={[
              { value: "kanban", icon: Columns3, label: "Board view" },
              { value: "list", icon: List, label: "List view" },
            ]}
            onChange={controls.setViewMode}
          />
          <HeaderSearchButton onClick={controls.openSearch} />
          <HeaderPrimaryButton onClick={controls.openCreate}>Add</HeaderPrimaryButton>
        </SectionHeader>
      )}
    />
  )
}
