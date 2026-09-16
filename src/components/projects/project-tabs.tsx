"use client"

import * as React from "react"
import Link from "next/link"
import { Inbox, PenTool, Puzzle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableSkeleton } from "@/components/dashboard/loading-states"
import { cn } from "@/lib/utils"
import { formatUpdatedDate } from "@/lib/date"
import { fetchProjectBoards, type ProjectBoard } from "@/lib/api/projects"
import { fetchPages, type PageSummary } from "@/lib/api/page"
import { PagesList } from "@/components/pages/pages-list"

/* ── Shared shells ──────────────────────────────────────────── */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {children}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Inbox
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function Loading({ rows = 5 }: { label?: string; rows?: number }) {
  return <TableSkeleton rows={rows} />
}

/**
 * Every tab does the same load/error/empty dance, so it lives here once.
 * `deps` re-runs the fetch the way useEffect deps would.
 */
function useTabData<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loader())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  React.useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

/* ── Tasks: see TasksView (components/tasks/tasks-view.tsx), used directly
   by the project's /tasks route for full Kanban + table parity with the
   global Tasks page. ─────────────────────────────────────────────────── */

/* ── Pages ──────────────────────────────────────────────────── */

export function ProjectPagesTab({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useTabData<PageSummary[]>(
    () => fetchPages(projectId),
    [projectId]
  )

  if (loading) return <Loading label="Loading pages..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return <PagesList pages={data ?? []} projectId={projectId} onChanged={reload} />
}

/* ── Board ──────────────────────────────────────────────────── */

export function ProjectBoardTab({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = useTabData<ProjectBoard[]>(
    () => fetchProjectBoards(projectId),
    [projectId]
  )

  if (loading) return <Loading label="Loading board..." />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const boards = data ?? []

  return (
    <Panel>
      {boards.length === 0 ? (
        <EmptyState
          icon={PenTool}
          title="No boards yet"
          description="Whiteboards created for this project show up here."
          action={
            <Button size="sm" asChild>
              <Link href={`/boards?projectId=${projectId}`}>New board</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <PenTool className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{board.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {board.createdBy?.name ? `${board.createdBy.name} · ` : ""}
                  updated {formatUpdatedDate(board.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  )
}

/* ── Integrations ───────────────────────────────────────────── */

export function ProjectIntegrationsTab({
  integrations,
}: {
  integrations: { id: string; name: string; type: string; connected: boolean }[]
}) {
  return (
    <Panel>
      {integrations.length === 0 ? (
        <EmptyState
          icon={Puzzle}
          title="No integrations connected"
          description="Connect GitHub, Slack, Notion or Linear to pull work into this workspace."
          action={
            <Button size="sm" asChild>
              <Link href="?settings=integrations">Browse integrations</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Puzzle className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{integration.name}</p>
                <p className="text-xs text-muted-foreground">{integration.type}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 gap-1 text-[11px] font-medium",
                  integration.connected
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    integration.connected ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
                {integration.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
