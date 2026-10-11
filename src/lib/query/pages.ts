"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { fetchPage, type PageDetail } from "@/lib/api/page"
import { queryKeys } from "@/lib/query/keys"

/**
 * A page document. Reopening a page shows its cached copy at once. Callers
 * should copy it into local draft state once (not mirror it), so a background
 * refetch can never overwrite what someone is typing.
 */
export function usePage(pageId: string) {
  return useQuery({
    queryKey: queryKeys.pages.detail(pageId),
    queryFn: () => fetchPage(pageId),
  })
}

/** Put a freshly saved page into the cache, so reopening it shows what was just saved. */
export function useCachePage() {
  const client = useQueryClient()
  return React.useCallback(
    (page: PageDetail) => client.setQueryData(queryKeys.pages.detail(page.id), page),
    [client]
  )
}
