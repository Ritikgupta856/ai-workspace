import { PageHeader } from "@/components/dashboard/page-header"
import { NewBoardButton } from "@/components/boards/new-board-button"
import { BoardsGridSkeleton } from "@/components/dashboard/loading-states"

/**
 * Boards is a server component that blocks on `auth` + `prisma` before it can
 * render (see `export const instant = false` on its page), so it has no
 * client-side loading state of its own — the route-level file is the only
 * place a skeleton can show while that fetch is in flight.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Boards" action={<NewBoardButton />} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BoardsGridSkeleton />
      </div>
    </div>
  )
}
