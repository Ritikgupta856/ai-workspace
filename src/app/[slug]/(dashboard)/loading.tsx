import { PageShellSkeleton } from "@/components/dashboard/loading-states"

/**
 * Shown while a dashboard route's code and data load. Previously a centred
 * spinner, which meant every navigation collapsed the layout to an empty well
 * and then snapped back — the skeleton holds the page's shape instead.
 */
export default function Loading() {
  return <PageShellSkeleton />
}
