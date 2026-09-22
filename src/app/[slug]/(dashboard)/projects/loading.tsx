import { TableSkeleton } from "@/components/dashboard/loading-states"

/** Projects list. Defaults to the list view, so that is what the placeholder draws. */
export default function Loading() {
  return <TableSkeleton rows={6} label="Loading projects" />
}
