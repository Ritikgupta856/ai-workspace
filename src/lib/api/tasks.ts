import type { Task, TaskStatus, TaskPriority } from "@/components/tasks/tasks-view"
import { apiFetch } from "@/lib/query/fetcher"

type ApiResponse<T> = { success: true; task?: T; tasks?: T[]; message?: string } | { success: false; error: string }

const BASE = "/api/tasks"

/** Full detail returned by `GET /api/tasks/[id]` — the list endpoints only carry `subtaskCount`. */
export type TaskDetail = Task & {
  parent: { id: string; title: string } | null
  subtasks: { id: string; title: string; status: TaskStatus }[]
  createdBy: string
  createdAt: string
}

export async function fetchTask(id: string): Promise<TaskDetail> {
  const res = await apiFetch(`${BASE}/${id}`)
  const json: ApiResponse<TaskDetail> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.task!
}

export type TaskComment = {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; image: string | null }
}

export type TaskAssignee = { userId: string; name: string; avatar: string | null }

/** Everything the task panel shows, from one `GET /api/tasks/[id]?panel=1`. */
export type TaskPanel = {
  task: TaskDetail
  comments: TaskComment[]
  members: TaskAssignee[]
  favorited: boolean
}

/** One request for everything the task panel shows. Cached and prefetched by `@/lib/query/tasks`. */
export async function fetchTaskPanel(id: string): Promise<TaskPanel> {
  const res = await apiFetch(`${BASE}/${id}?panel=1`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return { task: json.task, comments: json.comments, members: json.members, favorited: json.favorited }
}

export async function fetchTasks(projectId?: string): Promise<Task[]> {
  const res = await apiFetch(projectId ? `${BASE}?projectId=${projectId}` : BASE)
  const json: ApiResponse<Task> & { tasks?: Task[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.tasks ?? []
}

export async function fetchMyTasks(): Promise<Task[]> {
  const res = await apiFetch(`${BASE}?assignee=me`)
  const json: ApiResponse<Task> & { tasks?: Task[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.tasks ?? []
}

export async function createTask(data: {
  title: string
  description?: string
  projectId?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  labels?: string[]
  dueDate?: string | null
  parentTaskId?: string | null
}): Promise<Task> {
  const res = await apiFetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Task> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.task!
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assigneeId: string | null
    projectId: string
    labels: string[]
    dueDate: string | null
    parentTaskId: string | null
  }>
): Promise<Task> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Task> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.task!
}

export async function deleteTask(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" })
  const json: ApiResponse<never> = await res.json()
  if (!json.success) throw new Error(json.error)
}
