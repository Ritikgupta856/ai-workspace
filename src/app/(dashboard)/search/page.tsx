"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { PageHeading } from "@/components/ui/page-heading"

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeading
        title="Search your workspace"
        description="Search across chats, tasks, projects, and more."
      />
    </div>

  )
}
