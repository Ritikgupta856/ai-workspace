import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Skeletons that mirror the shape of the content they stand in for.
 *
 * A spinner tells you "something is happening" and nothing else; a skeleton
 * tells you what's about to appear and roughly where, so the page doesn't pop
 * from an empty well into a dense table the instant data resolves. These
 * replace the centred-spinner-plus-caption block that most list pages used.
 */

/** A table's header row + N body rows, each cell sized to a plausible column width. */
export function TableSkeleton({
  rows = 6,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-md border", className)}>
      <div className="bg-muted/40 flex h-12 items-center gap-4 border-b px-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="ml-auto h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-[45%] max-w-56" />
              <Skeleton className="h-2.5 w-[30%] max-w-40" />
            </div>
            <Skeleton className="hidden h-5 w-16 shrink-0 rounded-full sm:block" />
            <Skeleton className="hidden h-3 w-20 shrink-0 sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A grid of project/card panels — icon, two text lines, a badge, a progress bar, a footer row. */
export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-full" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex -space-x-2">
              <Skeleton className="border-background size-7 rounded-full border-2" />
              <Skeleton className="border-background size-7 rounded-full border-2" />
              <Skeleton className="border-background size-7 rounded-full border-2" />
            </div>
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Kanban board — column headers with a count pill, each holding a few loose cards. */
export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="bg-muted/30 flex w-72 shrink-0 flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="size-4 rounded-full" />
          </div>
          {Array.from({ length: c === 0 ? 3 : 2 }).map((_, i) => (
            <div key={i} className="bg-card space-y-2.5 rounded-lg border p-3 shadow-sm">
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Detail-page shell: title header, a tab strip, then a stat row and a couple of panels. */
export function DetailPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
      </div>

      <div className="flex items-center gap-6 border-b pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-16" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card space-y-3 rounded-xl border p-5 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-card space-y-3 rounded-xl border p-5 shadow-sm lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
        <div className="bg-card space-y-3 rounded-xl border p-5 shadow-sm">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Single note editor: a back button, title, meta line, then a page of prose. */
export function NoteDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
      </div>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}

/** Integration provider grid: logo tile, connect button, name, description. */
export function IntegrationsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Whiteboard grid: a preview thumbnail, a title, and a meta line. */
export function BoardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card flex flex-col rounded-xl border p-5 shadow-sm">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="mt-4 h-3.5 w-2/3" />
          <Skeleton className="mt-2 h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

/**
 * Home dashboard shell: greeting line, the four-cell stat bar, a chart, and
 * the two-column panel layout — each panel a header row plus a few list rows,
 * matching the actual page closely enough that nothing reflows on load.
 */
export function DashboardHomeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-400 flex-1 flex-col gap-5 p-4 sm:p-6">
      <Skeleton className="h-4 w-56" />

      <div className="bg-border grid gap-px overflow-hidden rounded-xl border shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card flex flex-col gap-4 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-0.75 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="bg-card space-y-4 rounded-xl border p-5 shadow-sm">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
          <PanelListSkeleton title rows={4} />
          <PanelListSkeleton title rows={3} />
        </div>
        <div className="flex flex-col gap-4">
          <PanelListSkeleton title rows={4} />
          <PanelListSkeleton title rows={3} />
          <PanelListSkeleton title rows={3} />
        </div>
      </div>
    </div>
  )
}

function PanelListSkeleton({ rows = 3, title = false }: { rows?: number; title?: boolean }) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-5 shadow-sm">
      {title && <Skeleton className="mb-2 h-3.5 w-28" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A left rail of note titles beside a blank editor pane. */
export function NotesSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 xl:grid-cols-[322px_minmax(0,1fr)]">
      <div className="flex min-h-0 max-h-90 flex-col gap-1 border-b p-2 xl:max-h-none xl:border-r xl:border-b-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-2.5 w-10" />
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-3 p-6 xl:flex">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}
