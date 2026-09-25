export type PageSummary = {
  id: string
  workspaceId: string
  projectId: string
  title: string
  icon: string | null
  coverImage: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; image: string | null }
}

export type PageDetail = {
  id: string
  workspaceId: string
  projectId: string
  project: { id: string; name: string }
  title: string
  content: unknown
  icon: string | null
  coverImage: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; image: string | null }
}

type ApiResponse<T> = ({ success: true } & T) | { success: false; error: string }

const BASE = "/api/pages"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json
}

export async function fetchPages(projectId: string): Promise<PageSummary[]> {
  const json = await request<{ pages: PageSummary[] }>(`${BASE}?projectId=${projectId}`)
  return json.pages
}

export async function fetchPage(id: string): Promise<PageDetail> {
  const json = await request<{ page: PageDetail }>(`${BASE}/${id}`)
  return json.page
}

export async function createPage(data: {
  title?: string
  projectId: string
  icon?: string | null
}): Promise<PageSummary> {
  const json = await request<{ page: PageSummary }>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return json.page
}

export async function updatePage(
  id: string,
  data: Partial<{
    title: string
    content: unknown
    icon: string | null
    coverImage: string | null
    projectId: string | null
  }>
): Promise<PageDetail> {
  const json = await request<{ page: PageDetail }>(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return json.page
}

export async function deletePage(id: string): Promise<void> {
  await request(`${BASE}/${id}`, { method: "DELETE" })
}

export async function uploadPageAttachment(
  file: File
): Promise<{ url: string; name: string; size: number; mediaType: string }> {
  const formData = new FormData()
  formData.set("file", file)
  const res = await fetch(`${BASE}/attachments`, { method: "POST", body: formData })
  const json: ApiResponse<{ url: string; name: string; size: number; mediaType: string }> =
    await res.json()
  if (!json.success) throw new Error(json.error)
  return json
}
