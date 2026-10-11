"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { apiRequestSignal } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"
import type { SearchResult } from "@/lib/search"

const SEARCH_DEBOUNCE_MS = 200

/**
 * ⌘K search. The request waits for a pause in typing, an outdated one is
 * cancelled when the query changes, and every answered query stays cached, so
 * retyping something recent is instant. Previous results stay on screen while
 * the next ones load instead of flashing empty.
 */
export function useSearch(rawQuery: string) {
  const q = rawQuery.trim()
  const debounced = useDebouncedValue(q, SEARCH_DEBOUNCE_MS)

  const query = useQuery({
    queryKey: queryKeys.search(debounced),
    queryFn: ({ signal }) => apiRequestSignal<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(debounced)}`, signal),
    enabled: debounced !== "",
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  return {
    results: q ? (query.data?.results ?? []) : [],
    /** Waiting out the debounce, or a request is in flight. */
    loading: q !== "" && (debounced !== q || query.isFetching),
  }
}
