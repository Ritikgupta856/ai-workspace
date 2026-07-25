import type { ProjectCardData } from "@/components/projects/project-card"
import type { ProjectStatus } from "@/lib/projects"

type ApiResponse<T> =
  | ({ success: true; project?: T; projects?: T[]; message?: string } & Record<
      string,
      unknown
    >)
  | { success: false; error: string }

const BASE = "/api/projects"

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "Request failed")
  return json as T
}

/* ── Projects ───────────────────────────────────────────────── */

export async function fetchProjects(): Promise<ProjectCardData[]> {
  const json = await get<{ projects: ProjectCardData[] }>(BASE)
  return json.projects ?? []
}

export async function createProject(data: {
  name: string
  description?: string
  status?: ProjectStatus
  icon?: string
}): Promise<ProjectCardData> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<ProjectCardData> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.project!
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string
    description: string
    status: ProjectStatus
    icon: string
  }>
): Promise<ProjectCardData> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<ProjectCardData> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.project!
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  const json: ApiResponse<never> = await res.json()
  if (!json.success) throw new Error(json.error)
}

/* ── Project sub-resources ──────────────────────────────────── */

export type ProjectTask = {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  labels: string[]
  dueDate: string | null
  createdAt: string
  updatedAt: string
  assignee: { id: string; name: string; image: string | null } | null
}

export type ProjectDocument = {
  id: string
  title: string
  contentType: string
  sourceUrl: string | null
  processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  processingError: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  source: { id: string; name: string; type: string } | null
}

export type ProjectMember = {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  joinedAt: string
  openTasks: number
  completedTasks: number
}

export type ProjectActivityItem = {
  id: string
  type: string
  description: string
  target: string
  createdAt: string
  user: { id: string; name: string; image: string | null }
}

export type ProjectKnowledge = {
  chunks: {
    id: string
    title: string
    excerpt: string
    chunkIndex: number
    sourceId: string
    sourceTitle: string
    createdAt: string
  }[]
  sources: {
    id: string
    title: string
    contentType: string
    processingStatus: string
    indexed: boolean
  }[]
  totalChunks: number
  indexedDocuments: number
  pendingDocuments: number
}

export async function fetchProjectTasks(
  projectId: string,
  status?: string
): Promise<ProjectTask[]> {
  const query = status && status !== "all" ? `?status=${status}` : ""
  const json = await get<{ tasks: ProjectTask[] }>(
    `${BASE}/${projectId}/tasks${query}`
  )
  return json.tasks
}

export async function createProjectTask(
  projectId: string,
  data: {
    title: string
    description?: string
    status?: string
    priority?: string
    assigneeId?: string | null
    dueDate?: string | null
  }
): Promise<ProjectTask> {
  const res = await fetch(`${BASE}/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "Failed to create task")
  return json.task
}

/** Task mutations go through the existing top-level task endpoint. */
export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || "Failed to update task")
}

export async function fetchProjectDocuments(
  projectId: string
): Promise<ProjectDocument[]> {
  const json = await get<{ documents: ProjectDocument[] }>(
    `${BASE}/${projectId}/documents`
  )
  return json.documents
}

export async function fetchProjectMembers(projectId: string): Promise<{
  members: ProjectMember[]
  unassignedTasks: number
}> {
  return get<{ members: ProjectMember[]; unassignedTasks: number }>(
    `${BASE}/${projectId}/members`
  )
}

export async function fetchProjectActivity(
  projectId: string,
  cursor?: string | null
): Promise<{ activities: ProjectActivityItem[]; nextCursor: string | null }> {
  const query = cursor ? `?cursor=${cursor}` : ""
  return get<{
    activities: ProjectActivityItem[]
    nextCursor: string | null
  }>(`${BASE}/${projectId}/activity${query}`)
}

export async function fetchProjectKnowledge(
  projectId: string,
  search?: string
): Promise<ProjectKnowledge> {
  const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""
  return get<ProjectKnowledge>(`${BASE}/${projectId}/knowledge${query}`)
}
