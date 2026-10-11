"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { SidebarData } from "@/lib/sidebar-data"
import { apiRequest, jsonRequest } from "@/lib/query/fetcher"
import { queryKeys } from "@/lib/query/keys"
import { useInvalidateSidebar } from "@/lib/query/sidebar"

export type NotificationType =
  | "MENTION"
  | "COMMENT_REPLY"
  | "TASK_ASSIGNMENT"
  | "TASK_UPDATE"
  | "TASK_COMPLETION"

export type NotificationDTO = {
  id: string
  type: NotificationType
  title: string | null
  message: string | null
  read: boolean
  archived: boolean
  createdAt: string
  taskId: string | null
  commentId: string | null
  task: { id: string; title: string; projectId: string | null } | null
  comment: { id: string; content: string; parentId: string | null } | null
  actor: { id: string; name: string; image: string | null } | null
}

export type InboxView = "inbox" | "unread" | "archived"
type InboxData = { notifications: NotificationDTO[]; unreadCount: number }

/** One inbox view. Each view is cached on its own, so switching tabs back and forth is instant. */
export function useNotifications(view: InboxView) {
  return useQuery({
    queryKey: queryKeys.notifications.view(view),
    queryFn: async (): Promise<InboxData> => {
      const json = await apiRequest<InboxData>(`/api/notifications?view=${view}`)
      return { notifications: json.notifications, unreadCount: json.unreadCount }
    },
  })
}

/**
 * Read, archive and the like. The change shows in every cached inbox view
 * straight away; the server's answer then replaces the guess, and the sidebar's
 * unread badge refreshes.
 */
export function usePatchNotification() {
  const client = useQueryClient()
  const invalidateSidebar = useInvalidateSidebar()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<NotificationDTO, "read" | "archived">>) =>
      apiRequest("/api/notifications", jsonRequest("PATCH", { id, ...data })),
    onMutate: async ({ id, ...data }) => {
      // Stop in-flight refetches of everything edited below, or a stale response
      // from a previous click lands afterwards and undoes the optimistic change.
      await Promise.all([
        client.cancelQueries({ queryKey: queryKeys.notifications.all }),
        client.cancelQueries({ queryKey: queryKeys.sidebar.all }),
      ])
      const previous = client.getQueriesData<InboxData>({ queryKey: queryKeys.notifications.all })
      const previousSidebar = client.getQueriesData<SidebarData>({ queryKey: queryKeys.sidebar.all })

      // Marking read or unread moves the unread count by one, in the inbox
      // tabs and in the sidebar badge, so both change the instant you click.
      const was = previous.flatMap(([, d]) => d?.notifications ?? []).find((n) => n.id === id)
      const delta = was && data.read !== undefined && was.read !== data.read ? (data.read ? -1 : 1) : 0

      client.setQueriesData<InboxData>({ queryKey: queryKeys.notifications.all }, (old) =>
        old && {
          notifications: old.notifications.map((n) => (n.id === id ? { ...n, ...data } : n)),
          unreadCount: Math.max(0, old.unreadCount + delta),
        }
      )
      if (delta !== 0) {
        client.setQueriesData<SidebarData>({ queryKey: queryKeys.sidebar.all }, (old) =>
          old && { ...old, unreadCount: Math.max(0, old.unreadCount + delta) }
        )
      }
      return { previous, previousSidebar }
    },
    onError: (error, _vars, context) => {
      context?.previous.forEach(([key, data]) => client.setQueryData(key, data))
      context?.previousSidebar.forEach(([key, data]) => client.setQueryData(key, data))
      toast.error(error instanceof Error ? error.message : "Failed to update notification")
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: queryKeys.notifications.all })
      invalidateSidebar()
    },
  })
}

export function useMarkAllRead() {
  const client = useQueryClient()
  const invalidateSidebar = useInvalidateSidebar()

  return useMutation({
    mutationFn: () => apiRequest("/api/notifications", jsonRequest("PATCH", { markAllRead: true })),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.notifications.all })
      invalidateSidebar()
    },
    onError: () => toast.error("Failed to mark all as read"),
  })
}
