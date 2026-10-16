import { currentWorkspaceSlug, WORKSPACE_HEADER } from "@/lib/workspace-header"

/**
 * `fetch` for the app's own API. Tags the request with the workspace the page
 * is on, so the server answers for that workspace rather than guessing one.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const slug = currentWorkspaceSlug()
  if (!slug) return fetch(input, init)
  const headers = new Headers(init?.headers)
  headers.set(WORKSPACE_HEADER, slug)
  return fetch(input, { ...init, headers })
}

/**
 * One way to call the app's own API from the client. Every route answers
 * `{ success, ... }`; anything else (or a non-JSON failure) becomes a thrown
 * `Error` with a readable message, which is what React Query surfaces as
 * `error` and what mutations show in a toast.
 */
export async function apiRequest<T extends object = object>(
  url: string,
  init?: RequestInit
): Promise<T & { success: true }> {
  const res = await apiFetch(url, init)
  const json = await res.json().catch(() => null)
  if (!json?.success) throw new Error(json?.error || `Request failed (${res.status})`)
  return json
}

/** `RequestInit` for a JSON write. */
export function jsonRequest(method: "POST" | "PATCH" | "PUT" | "DELETE", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}

/**
 * For endpoints that answer with plain JSON (no `success` flag) and can be
 * cancelled, such as search. A non-OK reply is an error React Query retries
 * or surfaces; the caller's `AbortSignal` cancels a request that is no longer wanted.
 */
export async function apiRequestSignal<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await apiFetch(url, { signal })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}
