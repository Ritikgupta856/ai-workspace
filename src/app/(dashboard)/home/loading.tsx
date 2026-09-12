import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHomeSkeleton } from "@/components/dashboard/loading-states"

/**
 * Home is a server component that blocks on `auth` + `prisma` before it can
 * render (see `export const instant = false` on its page), so it has no
 * client-side loading state of its own — the route-level file is the only
 * place a skeleton can show while that fetch is in flight.
 *
 * The title bar stands in for the greeting rather than reusing `PageHeader`
 * with empty text: the greeting depends on the user's name, which isn't known
 * until the blocked fetch resolves, and a skeleton reads better than a blank
 * heading.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="page-header flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="hidden h-4 w-28 sm:block" />
      </div>
      <DashboardHomeSkeleton />
    </div>
  )
}
