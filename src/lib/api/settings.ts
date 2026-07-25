import type {
  UpdateProfileValues,
  UpdateWorkspaceValues,
} from "@/lib/validation/settings"

type ApiResponse =
  | { success: true; [key: string]: unknown }
  | { success: false; error: string }

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json: ApiResponse = await res.json()
  if (!json.success) throw new Error(json.error || "Request failed")
  return json
}

export async function updateProfile(data: UpdateProfileValues) {
  return send("/api/profile", "PATCH", data)
}

export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceValues
) {
  return send(`/api/workspaces/${workspaceId}`, "PATCH", data)
}

export async function deleteWorkspace(workspaceId: string) {
  return send(`/api/workspaces/${workspaceId}`, "DELETE")
}
