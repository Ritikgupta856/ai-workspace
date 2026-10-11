"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiRequest, jsonRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"
import { useInvalidateSidebar } from "@/lib/query/sidebar"

export type FavoriteEntityType = "PROJECT" | "TASK" | "WHITEBOARD" | "PAGE"

/**
 * Whether one thing is favourited, plus an optimistic toggle. The star flips
 * immediately and rolls back with a toast if the request fails; on success the
 * sidebar's favourites list refreshes. Pass `initial` when the answer already
 * arrived with other data (the task panel does) to skip the extra request.
 */
export function useFavorite(
  entityType: FavoriteEntityType,
  entityId: string,
  initial?: boolean,
  options?: { enabled?: boolean }
) {
  const client = useQueryClient()
  const invalidateSidebar = useInvalidateSidebar()
  const key = queryKeys.favorites.one(entityType, entityId)

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const json = await apiRequest<{ favorited: boolean }>(
        `/api/favorites?entityType=${entityType}&entityId=${entityId}`
      )
      return json.favorited
    },
    initialData: initial,
    initialDataUpdatedAt: initial === undefined ? undefined : () => Date.now(),
    staleTime: 60_000,
    enabled: Boolean(entityId) && (options?.enabled ?? true),
  })

  const toggle = useMutation({
    mutationFn: (next: boolean) =>
      apiRequest(`/api/favorites`, jsonRequest(next ? "POST" : "DELETE", { entityType, entityId })),
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<boolean>(key)
      client.setQueryData(key, next)
      return { previous }
    },
    onError: (error, _next, context) => {
      client.setQueryData(key, context?.previous)
      toast.error(error instanceof Error ? error.message : "Failed to update favorite")
    },
    onSuccess: () => invalidateSidebar(),
  })

  return {
    favorited: query.data ?? false,
    /** False until the first answer arrives, so the star isn't clickable on a guess. */
    loaded: query.data !== undefined,
    pending: toggle.isPending,
    toggle: () => toggle.mutate(!(query.data ?? false)),
  }
}
