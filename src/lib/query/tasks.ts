"use client"

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as React from "react"

import type { Task } from "@/components/tasks/tasks-view"
import type { ActivityDTO } from "@/lib/activity"
import {
  fetchMyTasks,
  fetchTaskPanel,
  fetchTasks,
  type TaskAssignee,
  type TaskComment,
  type TaskPanel,
} from "@/lib/api/tasks"
import { apiFetch, apiRequest, jsonRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"

type ListScope = { assignedToMe?: boolean; projectId?: string }

const EMPTY_TASKS: Task[] = []

/**
 * A task list, cached by scope. Returning to a view shows what was loaded
 * before straight away and refreshes it in the background if it has gone stale.
 *
 * `setTasks` writes into the cache with the same `(prev) => next` shape as
 * `useState`, which is what optimistic edits (move, delete, duplicate) want:
 * every view of that list updates at once.
 */
export function useTaskList(scope: ListScope) {
  const client = useQueryClient()
  const { assignedToMe, projectId } = scope
  const key = React.useMemo(() => queryKeys.tasks.list({ assignedToMe, projectId }), [assignedToMe, projectId])

  const query = useQuery({
    queryKey: key,
    queryFn: () => (assignedToMe ? fetchMyTasks() : fetchTasks(projectId)),
  })

  const setTasks = React.useCallback(
    (next: Task[] | ((prev: Task[]) => Task[])) => {
      // An in-flight refetch would land after this edit and undo it.
      void client.cancelQueries({ queryKey: key })
      client.setQueryData<Task[]>(key, (prev) => (typeof next === "function" ? next(prev ?? []) : next))
    },
    [client, key]
  )

  return {
    tasks: query.data ?? EMPTY_TASKS,
    /** True only until the first load; a background refresh never flashes a skeleton. */
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
    setTasks,
  }
}

/** Everything the panel shows for one task. Prefetching and opening share one request and one cache entry. */
const panelOptions = (id: string) => ({
  queryKey: queryKeys.tasks.panel(id),
  queryFn: async ({ client }: { client: QueryClient }) => {
    const panel = await fetchTaskPanel(id)
    // The payload already says whether the task is starred; hand that to the
    // star's own query so it never makes a request for it.
    client.setQueryData(queryKeys.favorites.one("TASK", id), panel.favorited)
    return panel
  },
  staleTime: 15_000,
})

export function useTaskPanel(id: string | undefined) {
  return useQuery({ ...panelOptions(id ?? ""), enabled: Boolean(id) })
}

/** Warm a task's panel while the pointer rests on it. Does nothing if it's already fresh or in flight. */
export function prefetchTaskPanel(client: QueryClient, id: string) {
  void client.prefetchQuery(panelOptions(id))
}

/** Replace the task inside a cached panel, e.g. after an edit, without refetching it. */
export function patchTaskPanel(client: QueryClient, id: string, patch: (panel: TaskPanel) => TaskPanel) {
  client.setQueryData<TaskPanel>(queryKeys.tasks.panel(id), (prev) => (prev ? patch(prev) : prev))
}

/** Comments, seeded from the panel payload so the tab opens with data already in hand. */
export function useTaskComments(id: string, initial?: TaskComment[]) {
  return useQuery({
    queryKey: queryKeys.tasks.comments(id),
    queryFn: async (): Promise<TaskComment[]> => {
      const res = await apiFetch(`/api/tasks/${id}/comments`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.comments
    },
    initialData: initial,
    // Seeded data is as fresh as the panel it came from.
    initialDataUpdatedAt: initial ? () => Date.now() : undefined,
  })
}

/** The people a task can be assigned to; seeded when the panel already loaded them. */
export function useAssignableMembers(
  projectId: string | null,
  initial?: TaskAssignee[],
  options?: { enabled?: boolean }
) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryKey: queryKeys.members.assignable(projectId),
    queryFn: async (): Promise<TaskAssignee[]> => {
      const res = await apiFetch(projectId ? `/api/projects/${projectId}/members` : "/api/workspaces/members")
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return projectId
        ? json.members.map((m: { id: string; name: string; image: string | null }) => ({
            userId: m.id,
            name: m.name,
            avatar: m.image,
          }))
        : json.members.map((m: { userId: string; name: string; avatar: string | null }) => ({
            userId: m.userId,
            name: m.name,
            avatar: m.avatar,
          }))
    },
    initialData: initial,
    initialDataUpdatedAt: initial ? () => Date.now() : undefined,
    staleTime: 60_000,
  })
}

/** A task's own timeline; only fetched once its tab is opened. */
export function useTaskActivity(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tasks.activity(id),
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<ActivityDTO[]> => {
      const res = await apiFetch(`/api/activity?taskId=${id}&limit=30`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.activities
    },
  })
}

/**
 * Post a comment (or a reply, with `parentId`). The task's comments and
 * activity refresh afterwards, wherever the comment came from: the panel or the inbox.
 */
export function useAddTaskComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, content, parentId }: { taskId: string; content: string; parentId?: string }) =>
      apiRequest(`/api/tasks/${taskId}/comments`, jsonRequest("POST", { content, parentId })),
    onSuccess: (_data, { taskId }) => {
      client.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) })
      client.invalidateQueries({ queryKey: queryKeys.tasks.activity(taskId) })
    },
    onError: (error) => toast.error(error.message || "Failed to post comment"),
  })
}
