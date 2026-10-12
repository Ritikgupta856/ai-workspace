import { TableSkeleton } from "@/components/dashboard/loading-states"

/** My Tasks opens on the list view. */
export default function Loading() {
  return <TableSkeleton rows={8} label="Loading tasks" />
}
