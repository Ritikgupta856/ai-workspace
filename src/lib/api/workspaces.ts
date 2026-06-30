import type { WorkspaceItem } from "@/components/layout/app-sidebar"
import type { CreateWorkspaceValues } from "@/lib/validation/workspace"

type ApiResponse<T> =
  | { success: true; workspace?: T; workspaces?: T[] }
  | { success: false; error: string }

export async function fetchWorkspaces(): Promise<WorkspaceItem[]> {
  const res = await fetch("/api/workspaces")
  const json: ApiResponse<WorkspaceItem> & { workspaces?: WorkspaceItem[] } = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.workspaces ?? []
}

export async function createWorkspace(data: CreateWorkspaceValues): Promise<{ id: string; name: string; slug: string }> {
  const res = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const json: ApiResponse<{ id: string; name: string; slug: string }> = await res.json()
  if (!json.success) throw new Error(json.error || "Failed to create workspace")
  return json.workspace!
}

export async function switchWorkspace(workspaceId: string): Promise<void> {
  const res = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId }),
  })
  const json: ApiResponse<never> = await res.json()
  if (!json.success) throw new Error(json.error || "Failed to switch workspace")
}
