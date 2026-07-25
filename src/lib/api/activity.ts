import type { ActivityDTO } from "@/lib/activity"

export type ActivityScope = {
  projectId?: string
  taskId?: string
  userId?: string
  type?: string
  limit?: number
}

export type ActivityPage = {
  activities: ActivityDTO[]
  nextCursor: string | null
}

/** One fetcher for every feed — card, list and timeline all call this. */
export async function fetchActivity(
  scope: ActivityScope = {},
  cursor?: string | null
): Promise<ActivityPage> {
  const params = new URLSearchParams()
  if (scope.projectId) params.set("projectId", scope.projectId)
  if (scope.taskId) params.set("taskId", scope.taskId)
  if (scope.userId) params.set("userId", scope.userId)
  if (scope.type) params.set("type", scope.type)
  if (scope.limit) params.set("limit", String(scope.limit))
  if (cursor) params.set("cursor", cursor)

  const query = params.toString()
  const res = await fetch(`/api/activity${query ? `?${query}` : ""}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "Failed to load activity")

  return { activities: json.activities, nextCursor: json.nextCursor }
}
