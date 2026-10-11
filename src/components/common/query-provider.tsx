"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * One client for the whole app. Data counts as fresh for 30s, so moving
 * between views shows cached results instantly and only refetches stale ones
 * in the background. Focus refetching is off: edits are optimistic and a tab
 * switch shouldn't re-render a list under the user's cursor.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // State, not a module constant: the server would otherwise share one cache across users.
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
