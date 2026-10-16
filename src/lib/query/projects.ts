"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { ProjectDashboardResponse } from "@/components/projects/project-dashboard-context"
import type { ProjectCardData } from "@/components/projects/project-card"
import { fetchProjects } from "@/lib/api/projects"
import { apiFetch, apiRequest, jsonRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"
import { useInvalidateSidebar } from "@/lib/query/sidebar"

/**
 * A project's dashboard. The server layout renders the first copy, which seeds
 * the cache, so there is no loading state. Pages edit it optimistically through
 * `setData` and call `reload` after a mutation.
 */
export function useProjectDashboard(projectId: string, initialData: ProjectDashboardResponse) {
  const client = useQueryClient()
  const key = queryKeys.projects.dashboard(projectId)

  const { data } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ProjectDashboardResponse> => {
      const res = await apiFetch(`/api/projects/${projectId}/dashboard`)
      const json: ProjectDashboardResponse = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to load project")
      return json
    },
    initialData,
    initialDataUpdatedAt: () => Date.now(),
    staleTime: 60_000,
  })

  const setData = React.useCallback<React.Dispatch<React.SetStateAction<ProjectDashboardResponse | null>>>(
    (action) =>
      client.setQueryData<ProjectDashboardResponse>(key, (prev) => {
        const next = typeof action === "function" ? action(prev ?? initialData) : action
        return next ?? initialData
      }),
    [client, key, initialData]
  )

  const reload = React.useCallback(() => {
    void client.invalidateQueries({ queryKey: key })
  }, [client, key])

  return { data, setData, reload }
}

/** Add or remove a person on a project. The dashboard (team, stats) refreshes afterwards. */
export function useProjectMemberActions(projectId: string) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: queryKeys.projects.dashboard(projectId) })

  const add = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/projects/${projectId}/members`, jsonRequest("POST", { userId })),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to add member"),
  })

  const remove = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/projects/${projectId}/members?userId=${userId}`, { method: "DELETE" }),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || "Failed to remove member"),
  })

  /** The person with a request in flight, so their row can show a spinner. */
  const busyUserId = (add.isPending ? add.variables : remove.isPending ? remove.variables : null) ?? null

  return { add: add.mutate, remove: remove.mutate, busyUserId }
}

const NO_PROJECTS: ProjectCardData[] = []

/**
 * The workspace's projects, cached. `setProjects` writes into the cache with
 * the same `(prev) => next` shape as `useState`, so optimistic status changes,
 * duplicates and deletes update every view of the list at once.
 */
export function useProjectList() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.projectList, queryFn: fetchProjects })

  const setProjects = React.useCallback(
    (next: ProjectCardData[] | ((prev: ProjectCardData[]) => ProjectCardData[])) => {
      // An in-flight refetch would land after this edit and undo it.
      void client.cancelQueries({ queryKey: queryKeys.projectList })
      client.setQueryData<ProjectCardData[]>(queryKeys.projectList, (prev) =>
        typeof next === "function" ? next(prev ?? NO_PROJECTS) : next
      )
    },
    [client]
  )

  return {
    projects: query.data ?? NO_PROJECTS,
    loading: query.isPending,
    error: query.error ? query.error.message || "Failed to load projects" : null,
    refetch: query.refetch,
    setProjects,
  }
}

/**
 * A project was created, edited, archived or deleted: refresh the Projects
 * list and the sidebar that shows it. Everything that changes a project calls this.
 */
export function useInvalidateProjects() {
  const client = useQueryClient()
  const invalidateSidebar = useInvalidateSidebar()
  return React.useCallback(() => {
    void client.invalidateQueries({ queryKey: queryKeys.projectList })
    invalidateSidebar()
  }, [client, invalidateSidebar])
}
