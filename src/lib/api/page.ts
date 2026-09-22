export type PageSummary = {
  id: string
  workspaceId: string
  projectId: string | null
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
  projectId: string | null
  project: { id: string; name: string } | null
  title: string
  content: unknown
  icon: string | null
  coverImage: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; image: string | null }
}

/**
 * Where a page opens. A page inside a project lives under that project, so its
 * URL and breadcrumb both read project-first; a workspace-level page has no
 * project to nest under and stays at the top level.
 */
export function pageHref(
  slug: string,
  page: { id: string; projectId: string | null }
): string {
  return page.projectId
    ? `/${slug}/projects/${page.projectId}/pages/${page.id}`
    : `/${slug}/pages/${page.id}`
}

type ApiResponse<T> = ({ success: true } & T) | { success: false; error: string }

const BASE = "/api/pages"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json
}

/** Omitted `projectId` returns workspace-level pages (projectId IS NULL). */
export async function fetchPages(projectId?: string): Promise<PageSummary[]> {
  const json = await request<{ pages: PageSummary[] }>(
    projectId ? `${BASE}?projectId=${projectId}` : BASE
  )
  return json.pages
}

export async function fetchPage(id: string): Promise<PageDetail> {
  const json = await request<{ page: PageDetail }>(`${BASE}/${id}`)
  return json.page
}

export async function createPage(data: {
  title?: string
  projectId?: string | null
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
