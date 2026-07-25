"use client"

import { ActivityFeed } from "@/components/activity/activity-feed"
import type { ActivityDTO } from "@/lib/activity"

/**
 * Thin wrapper kept so the overview keeps its existing import. The colour map,
 * initials helper and row markup that used to live here now come from
 * ActivityFeed, which the project tab and task timeline share.
 */
export type ActivityItemData = ActivityDTO

export function RecentActivity({
  activities,
  projectId,
}: {
  activities: ActivityItemData[]
  projectId?: string
}) {
  return (
    <ActivityFeed
      variant="card"
      items={activities}
      limit={6}
      title="Recent activity"
      viewAllHref={projectId ? `/projects/${projectId}?tab=activity` : undefined}
      emptyMessage="No activity yet. Start working to see events here."
    />
  )
}
