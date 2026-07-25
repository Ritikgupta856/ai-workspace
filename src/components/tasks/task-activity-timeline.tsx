"use client"

import { ActivityFeed } from "@/components/activity/activity-feed"

/**
 * Task timeline. Previously this rendered a hardcoded array using its own
 * lowercase type vocabulary (`status_change`, `pr_linked`) that no row in the
 * Activity table ever had — so every task showed the same fake events.
 *
 * It now reads the real feed, scoped by the taskId that `logActivity` writes
 * into metadata.
 */
export function TaskActivityTimeline({ taskId }: { taskId: string }) {
  return (
    <ActivityFeed
      variant="timeline"
      scope={{ taskId }}
      emptyMessage="No activity on this task yet."
    />
  )
}
