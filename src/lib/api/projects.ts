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

/* ── Board (whiteboards), scoped to a project ─── */

export type ProjectBoard = {
  id: string
  title: string
  updatedAt: string
  createdBy: { name: string | null; image: string | null } | null
}

export async function fetchProjectBoards(projectId: string): Promise<ProjectBoard[]> {
  const res = await fetch(`/api/boards?projectId=${projectId}`)
  const json = await res.json()
  return json.boards ?? []
}

export async function createProjectBoard(projectId: string): Promise<{ id: string }> {
  const res = await fetch("/api/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "Could not create board")
  return json.board
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`/api/boards/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? "Could not delete board")
  }
}
