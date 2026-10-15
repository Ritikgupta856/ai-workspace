import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Skeletons that mirror the shape of the content they stand in for.
 *
 * A spinner tells you "something is happening" and nothing else; a skeleton
 * tells you what's about to appear and roughly where, so the page doesn't pop
 * from an empty well into a dense table the instant data resolves.
 *
 * Every loading view in the app comes from this file. Two rules keep them
 * feeling like one system rather than a pile of grey boxes:
 *
 *  - the placeholder's footprint matches the real thing — same row height, same
 *    grid, same card padding — so nothing shifts when the data lands;
 *  - the counts are small and fixed. A skeleton is a promise about layout, not
 *    about how many rows are coming, and filling the viewport with forty fake
 *    rows makes the real result feel like a loss.
 */

/** A table's header row + N body rows, each cell sized to a plausible column width. */
export function TableSkeleton({
  rows = 6,
  className,
  label = "Loading",
}: {
  rows?: number
  className?: string
  label?: string
}) {
  return (
    <SkeletonRegion
      label={label}
      className={cn("overflow-hidden rounded-md border", className)}
    >
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
    </SkeletonRegion>
  )
}

/** A grid of project/card panels — icon, two text lines, a badge, a progress bar, a footer row. */
export function CardGridSkeleton({
  count = 6,
  className,
  label = "Loading",
}: {
  count?: number
  className?: string
  label?: string
}) {
  return (
    <SkeletonRegion
      label={label}
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}
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
    </SkeletonRegion>
  )
}

/** Kanban board — column headers with a count pill, each holding a few loose cards. */
export function BoardSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <SkeletonRegion label="Loading board" className="flex gap-4 overflow-x-auto pb-2">
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
    </SkeletonRegion>
  )
}

/** Detail-page shell: title header, a tab strip, then a stat row and a couple of panels. */
export function DetailPageSkeleton() {
  return (
    <SkeletonRegion label="Loading" className="flex flex-1 flex-col gap-5">
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
    </SkeletonRegion>
  )
}

/**
 * The breadcrumb bar both detail views open with: a trail on the left, a star
 * and an overflow button on the right, in a 48px row with a bottom border.
 */
function DetailBreadcrumbSkeleton({ crumbs = 2 }: { crumbs?: number }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <Skeleton className="size-3.5 shrink-0 rounded-sm" />
        <Skeleton className="h-3 w-20" />
        {Array.from({ length: crumbs - 1 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30 text-sm">/</span>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="size-7 rounded-md" />
      </div>
    </div>
  )
}

/**
 * A page (rich document): breadcrumb bar, the editor's formatting toolbar, then
 * the centred column — emoji tile, oversized title, body copy.
 *
 * The measurements track the real editor deliberately: `max-w-3xl` with the
 * same padding, a `size-12` icon and a title block the height of 4xl/5xl text,
 * so the document doesn't jump down the page when it loads.
 */
export function PageDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading page" className="flex flex-1 flex-col">
      <DetailBreadcrumbSkeleton />

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 overflow-hidden border-b px-4 py-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className={cn("size-7 rounded-md", i === 4 && "ml-1.5")} />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-8 py-14 sm:px-12">
          <Skeleton className="mb-2 size-12 rounded-xl" />
          <Skeleton className="h-10 w-2/3 sm:h-12" />
          <div className="mt-8 space-y-3.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}

/**
 * A task: breadcrumb bar, then title, the row of property pills (status,
 * priority, assignee, due date), a description block and the details section
 * below it.
 */
/** Integration provider grid: logo tile, connect button, name, description. */
export function IntegrationsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonRegion
      label="Loading integrations"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
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
    </SkeletonRegion>
  )
}

/**
 * Notification rows: type badge, a line of text, a timestamp. Matches the
 * 44px-min row of the real list so the page doesn't jump as they resolve.
 */
export function InboxSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <SkeletonRegion label="Loading notifications" className="flex flex-col gap-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-11 items-center gap-3 rounded-lg px-4 py-2">
          <Skeleton className="size-7 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-3", i % 3 === 0 ? "w-2/5" : "w-3/5")} />
            {i % 3 === 0 && <Skeleton className="h-2.5 w-1/3" />}
          </div>
          <Skeleton className="h-2.5 w-12 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  )
}

/**
 * Activity rows — avatar, a sentence, a timestamp. `dense` matches the compact
 * variant used inside dashboard cards.
 */
export function ActivitySkeleton({
  rows = 5,
  dense = false,
}: {
  rows?: number
  dense?: boolean
}) {
  return (
    <SkeletonRegion label="Loading activity" className={cn(dense ? "divide-y" : "divide-y")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn("flex items-center gap-3", dense ? "px-4 py-2.5" : "px-4 py-3.5")}
        >
          <Skeleton className={cn("shrink-0 rounded-full", dense ? "size-7" : "size-8")} />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-3", i % 2 === 0 ? "w-3/5" : "w-2/5")} />
            {!dense && <Skeleton className="h-2.5 w-24" />}
          </div>
          <Skeleton className="h-2.5 w-14 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  )
}

/** A settings dialog panel: section heading, a couple of fields, a footer action. */
export function SettingsPanelSkeleton() {
  return (
    <SkeletonRegion label="Loading settings" className="flex flex-col gap-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-2.5 w-64" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-44" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 border-b py-3.5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-40" />
          </div>
          <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
        </div>
      ))}
    </SkeletonRegion>
  )
}

/**
 * The route-level fallback, shown while a dashboard page's code and data are
 * still in flight. It cannot know which page is coming, so it draws only what
 * every page here shares — a header line and a body block — instead of guessing
 * a table or a grid and being wrong half the time.
 */
export function PageShellSkeleton() {
  return (
    <SkeletonRegion label="Loading" className="flex flex-1 flex-col">
      <div className="flex h-14 items-center gap-3 border-b px-5">
        <Skeleton className="size-5 rounded-md" />
        <Skeleton className="h-3.5 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pt-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="ml-auto h-8 w-32 rounded-md" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    </SkeletonRegion>
  )
}

/* ── Redesigned page shells ─────────────────────────────────── */

/** 48px top bar: breadcrumb on the left, search box and theme button on the right. */
function TopBarSkeleton({ crumbs = 2 }: { crumbs?: number }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/70 px-5">
      {Array.from({ length: crumbs }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === 0 ? "w-16" : i === 1 ? "w-32" : "w-14")} />
      ))}
      <div className="ml-auto flex items-center gap-2.5">
        <Skeleton className="hidden h-8 w-56 rounded-lg sm:block sm:w-72" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </div>
  )
}

/** Big page title + one-line summary on the left, primary button on the right. */
function TitleBlockSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-8 pb-5">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  )
}

/** Search box, a couple of filter pills, and the view switch at the right end. */
function SearchRowSkeleton({ pills = 2, switchWidth = "w-56" }: { pills?: number; switchWidth?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/70 px-6 pb-4">
      <Skeleton className="h-9 w-56 rounded-lg sm:w-64" />
      {Array.from({ length: pills }).map((_, i) => (
        <Skeleton key={i} className="hidden h-8 w-24 rounded-lg md:block" />
      ))}
      <Skeleton className={cn("ml-auto h-8 rounded-lg", switchWidth)} />
    </div>
  )
}

/** A white card with a title row, as used on Home and the project overview. */
function CardSkeleton({ titleWidth = "w-28", children }: { titleWidth?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xs">
      <div className="flex h-12 items-center justify-between px-5">
        <Skeleton className={cn("h-3.5", titleWidth)} />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  )
}

/** Project overview: breadcrumb bar, project title block, About/Progress/Coming up + Details/Health/Activity. */
export function ProjectOverviewSkeleton() {
  return (
    <SkeletonRegion label="Loading project" className="flex flex-1 flex-col">
      <TopBarSkeleton />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-6 pb-12">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center -space-x-1.5 sm:flex">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="size-7 rounded-full ring-2 ring-background" />
              ))}
            </div>
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-6">
            <CardSkeleton titleWidth="w-14">
              <div className="space-y-2.5 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </CardSkeleton>
            <CardSkeleton titleWidth="w-20">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
              <div className="mt-4 flex flex-wrap gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-20" />
                ))}
              </div>
            </CardSkeleton>
            <CardSkeleton titleWidth="w-24">
              <div className="-mx-5 -mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex h-12 items-center gap-3 border-t border-border/70 px-5">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className={cn("h-3.5", i % 2 ? "w-1/2" : "w-2/3")} />
                    <Skeleton className="ml-auto h-3 w-14" />
                    <Skeleton className="size-6 rounded-full" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <CardSkeleton titleWidth="w-16">
              <div className="flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex h-10 items-center gap-3">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className={cn("h-3.5", i % 2 ? "w-20" : "w-28")} />
                  </div>
                ))}
              </div>
            </CardSkeleton>
            <CardSkeleton titleWidth="w-28">
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-3.5 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="ml-auto h-3 w-5" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
            <CardSkeleton titleWidth="w-28">
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-6 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}

/** My Tasks / project Tasks: title block, search row with the List/Kanban/Calendar switch, grouped table. */
export function TaskListPageSkeleton({ crumbs = 1 }: { crumbs?: number }) {
  return (
    <SkeletonRegion label="Loading tasks" className="flex flex-1 flex-col">
      <TopBarSkeleton crumbs={crumbs} />
      <TitleBlockSkeleton />
      <SearchRowSkeleton pills={2} switchWidth="w-64" />
      <div className="px-6 pt-1">
        <div className="flex h-10 items-center gap-4 border-b border-border/70 px-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto hidden h-3 w-16 lg:block" />
          <Skeleton className="hidden h-3 w-14 md:block" />
          <Skeleton className="h-3 w-16" />
        </div>
        {[3, 4].map((rows, g) => (
          <div key={g}>
            <div className="flex h-12 items-center gap-2 px-1">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="border-t border-border/70">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex h-12 items-center gap-3 border-b border-border/70 px-3">
                  <Skeleton className="size-5 rounded-full" />
                  <Skeleton className="hidden h-3 w-14 sm:block" />
                  <Skeleton className={cn("h-3.5", i % 2 ? "w-1/3" : "w-2/5")} />
                  <Skeleton className="ml-auto hidden h-3 w-24 lg:block" />
                  <Skeleton className="hidden h-3 w-16 md:block" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  )
}

/** Pages / Whiteboards: title block, search row with the List/Grid switch, a simple table. */
export function LibraryPageSkeleton() {
  return (
    <SkeletonRegion label="Loading" className="flex flex-1 flex-col">
      <TopBarSkeleton crumbs={3} />
      <TitleBlockSkeleton />
      <SearchRowSkeleton pills={1} switchWidth="w-36" />
      <div className="px-6 pt-2">
        <div className="flex h-10 items-center gap-4 border-b border-border/70 px-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto hidden h-3 w-20 sm:block" />
          <Skeleton className="hidden h-3 w-16 sm:block" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-12 items-center gap-3 border-b border-border/70 px-3">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className={cn("h-3.5", i % 2 ? "w-1/4" : "w-1/3")} />
            <Skeleton className="ml-auto hidden h-3 w-28 sm:block" />
            <Skeleton className="hidden h-3 w-20 sm:block" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  )
}
