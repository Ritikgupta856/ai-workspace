import { Suspense } from "react"

import { SettingsView } from "@/components/settings/settings-view"
import { SettingsPanelSkeleton } from "@/components/dashboard/loading-states"

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPanelSkeleton />}>
      <SettingsView />
    </Suspense>
  )
}
