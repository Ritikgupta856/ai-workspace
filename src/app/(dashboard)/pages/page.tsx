"use client"

import * as React from "react"

import { PageHeader } from "@/components/dashboard/page-header"
import { NotesSkeleton } from "@/components/dashboard/loading-states"
import { PagesList, NewPageButton } from "@/components/pages/pages-list"
import { fetchPages, type PageSummary } from "@/lib/api/page"

export default function PagesListPage() {
  const [pages, setPages] = React.useState<PageSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    setError(null)
    fetchPages()
      .then(setPages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pages"))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Pages" action={<NewPageButton onCreated={load} />} />

      <div className="flex flex-1 flex-col gap-4 p-6">
        {loading ? (
          <NotesSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-sm text-destructive">{error}</div>
        ) : (
          <PagesList pages={pages} onChanged={load} />
        )}
      </div>
    </div>
  )
}
