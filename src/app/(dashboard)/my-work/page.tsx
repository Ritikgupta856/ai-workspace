"use client"

import * as React from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { DataTable } from "@/components/ui/data-table"
import { SearchInput } from "@/components/ui/search-input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSkeleton } from "@/components/dashboard/loading-states"
import { fetchMyTasks } from "@/lib/api/tasks"
import { columns, type Task, type TaskStatus } from "@/components/tasks/tasks-view"

type StatusFilter = "ALL" | TaskStatus

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
]

export default function MyWorkPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMyTasks()
      .then(setTasks)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tasks"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = React.useMemo(() => {
    let result = tasks
    if (status !== "ALL") result = result.filter((t) => t.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [tasks, status, search])

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="My Work" />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search my tasks..."
            compact
            className="max-w-xs"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Nothing assigned to you</p>
            <p className="mt-1 text-xs">Tasks assigned to you across every project show up here.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </div>
  )
}
