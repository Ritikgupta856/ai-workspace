import type { Task, TaskStatus, TaskPriority } from "@/app/(dashboard)/tasks/page"

type ApiResponse<T> = { success: true; task?: T; tasks?: T[]; message?: string } | { success: false; error: string }

const BASE = "/api/tasks"

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(BASE)
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
