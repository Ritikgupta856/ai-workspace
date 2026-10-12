"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { SettingsData } from "@/components/settings/settings-panels"
import { apiRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"

/** Profile, workspace and subscription for the settings dialog; fetched when it opens, cached after. */
export function useSettings(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.settings,
    enabled,
    queryFn: async (): Promise<SettingsData> => {
      const json = await apiRequest<SettingsData>("/api/settings")
      return { profile: json.profile, workspace: json.workspace, role: json.role, subscription: json.subscription }
    },
  })
}

/** Call after a save so the dialog (and anything else showing these values) refetches. */
export function useInvalidateSettings() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: queryKeys.settings })
}
