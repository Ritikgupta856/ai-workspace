"use client"

import { useQuery } from "@tanstack/react-query"

import type { IntegrationRuntime } from "@/components/integrations/integrations-view"
import { apiRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"

/** Connection state for every integration, keyed by provider. */
export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: async () =>
      (await apiRequest<{ runtimes: Record<string, IntegrationRuntime> }>("/api/integrations")).runtimes,
  })
}
