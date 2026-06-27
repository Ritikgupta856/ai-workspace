"use client"

import { Settings } from "lucide-react"
import { PageHeading } from "@/components/ui/page-heading"

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeading
        title="Settings"
        description="Manage your workspace settings."
      />
    </div>
  )
}
