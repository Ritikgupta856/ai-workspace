/**
 * The sidebar renders from server data and only re-fetches when told to.
 * Anything that changes projects, favorites or unread notifications fires this
 * after its request succeeds.
 */
export const SIDEBAR_REFRESH_EVENT = "synapse:sidebar-refresh"

export function requestSidebarRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SIDEBAR_REFRESH_EVENT))
}
