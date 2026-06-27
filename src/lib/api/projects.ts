import type { ProjectCardData } from "@/components/projects/project-card"

type ApiResponse<T> =
  | { success: true; project?: T; projects?: T[]; message?: string }
  | { success: false; error: string }

const BASE = "/api/projects"

export async function fetchProjects(): Promise<ProjectCardData[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<ProjectCardData> & { projects?: ProjectCardData[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.projects ?? []
}

export async function createProject(data: {
  name: string
  description?: string
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
