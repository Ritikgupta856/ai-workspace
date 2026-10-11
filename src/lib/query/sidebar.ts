"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { SidebarData } from "@/lib/sidebar-data"
import { apiRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"

/**
 * The sidebar starts from what the server rendered and only refetches when
 * something it shows changes (see `useInvalidateSidebar`). The key includes the
 * workspace, so switching workspaces can never show another one's projects.
 */
export function useSidebarData(slug: string, workspaceId: string | null, initialData: SidebarData) {
  return useQuery({
    queryKey: queryKeys.sidebar.of(workspaceId),
    queryFn: async (): Promise<SidebarData> => {
      const json = await apiRequest<SidebarData>(`/api/sidebar?slug=${slug}`)
      return { projects: json.projects, favorites: json.favorites, unreadCount: json.unreadCount }
    },
    initialData,
    initialDataUpdatedAt: () => Date.now(),
    staleTime: 60_000,
  }).data
}

/**
 * Call after anything the sidebar shows has changed: a project created or
 * archived, a favourite toggled, a notification read. Replaces the old
 * window-event bus with the same effect and no listeners to manage.
 */
export function useInvalidateSidebar() {
  const client = useQueryClient()
  return React.useCallback(() => client.invalidateQueries({ queryKey: queryKeys.sidebar.all }), [client])
}
