import { PageHeader } from "@/components/dashboard/page-header"
import { IntegrationsSkeleton } from "@/components/dashboard/loading-states"

/**
 * Integrations is a server component that blocks on `auth` + `prisma` before
 * it can render (see `export const instant = false` on its page), so it has
 * no client-side loading state of its own — the route-level file is the only
 * place a skeleton can show while that fetch is in flight.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Integrations" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <IntegrationsSkeleton />
      </div>
    </div>
  )
}
