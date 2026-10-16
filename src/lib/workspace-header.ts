/**
 * Which workspace an API request is about. Every dashboard URL starts with the
 * workspace slug (`/acme/projects/…`), so the browser sends that slug with each
 * call, as a header or, for full-page navigations that can't carry one, as a
 * `?workspace=` param. The server still checks the user is a member of it.
 */
export const WORKSPACE_HEADER = "x-workspace-slug"
export const WORKSPACE_PARAM = "workspace"

/** The slug of the workspace page the browser is on, or null outside the browser. */
export function currentWorkspaceSlug(): string | null {
  if (typeof window === "undefined") return null
  return window.location.pathname.split("/")[1] || null
}

/** An API URL for a full-page navigation, tagged with the current workspace. */
export function withWorkspace(url: string): string {
  const slug = currentWorkspaceSlug()
  if (!slug) return url
  return `${url}${url.includes("?") ? "&" : "?"}${WORKSPACE_PARAM}=${encodeURIComponent(slug)}`
}
