import type { Task, TaskStatus, TaskPriority } from "@/components/tasks/tasks-view"

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
  const res = await fetch(`${BASE}/${id}`)
  const json: ApiResponse<TaskDetail> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.task!
}

export async function fetchTasks(projectId?: string): Promise<Task[]> {
  const res = await fetch(projectId ? `${BASE}?projectId=${projectId}` : BASE)
  const json: ApiResponse<Task> & { tasks?: Task[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.tasks ?? []
}

export async function fetchMyTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}?assignee=me`)
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
  const res = await fetch(`${BASE}/generate`, {
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
    assigneeId: string
    projectId: string
    labels: string[]
    dueDate: string | null
    parentTaskId: string | null
  }>
): Promise<Task> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<Task> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.task!
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  const json: ApiResponse<never> = await res.json()
  if (!json.success) throw new Error(json.error)
}
