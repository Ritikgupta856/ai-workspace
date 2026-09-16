"use client"

import * as React from "react"
import Link from "next/link"
import {
  AtSign,
  MessageSquare,
  UserPlus,
  Pencil,
  CheckCircle2,
  Archive,
  ArchiveRestore,
  Inbox as InboxIcon,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

type NotificationType =
  | "MENTION"
  | "COMMENT_REPLY"
  | "TASK_ASSIGNMENT"
  | "TASK_UPDATE"
  | "TASK_COMPLETION"

type NotificationDTO = {
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

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: typeof AtSign; className: string }> = {
  MENTION: { label: "Mention", icon: AtSign, className: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  COMMENT_REPLY: { label: "Reply", icon: MessageSquare, className: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  TASK_ASSIGNMENT: { label: "Assigned", icon: UserPlus, className: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  TASK_UPDATE: { label: "Update", icon: Pencil, className: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  TASK_COMPLETION: { label: "Completed", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
}

function NotificationRow({
  notification,
  onToggleRead,
  onToggleArchive,
  onReply,
}: {
  notification: NotificationDTO
  onToggleRead: (id: string, read: boolean) => void
  onToggleArchive: (id: string, archived: boolean) => void
  onReply: (notification: NotificationDTO, content: string) => Promise<void>
}) {
  const config = TYPE_CONFIG[notification.type]
  const Icon = config.icon
  const [replying, setReplying] = React.useState(false)
  const [replyText, setReplyText] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const canReply =
    notification.taskId &&
    (notification.type === "COMMENT_REPLY" || notification.type === "MENTION")

  async function handleSend() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await onReply(notification, replyText.trim())
      setReplyText("")
      setReplying(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b px-4 py-3 transition-colors last:border-0",
        !notification.read && "bg-primary/3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", config.className)}>
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
            <span className="text-sm font-medium text-foreground">
              {notification.actor?.name ? `${notification.actor.name} · ` : ""}
              {notification.title || config.label}
            </span>
            <span className="text-xs text-muted-foreground">{formatUpdatedDate(notification.createdAt)}</span>
          </div>
          {notification.message && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{notification.message}</p>
          )}
          {notification.comment && (
            <p className="mt-1 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {notification.comment.content}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {notification.taskId && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/tasks?task=${notification.taskId}`}>Open</Link>
            </Button>
          )}
          {canReply && (
            <Button variant="ghost" size="sm" onClick={() => setReplying((v) => !v)}>
              Reply
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleRead(notification.id, !notification.read)}
          >
            {notification.read ? "Mark unread" : "Mark read"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleArchive(notification.id, !notification.archived)}
            title={notification.archived ? "Unarchive" : "Archive"}
          >
            {notification.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
          </Button>
        </div>
      </div>

      {replying && (
        <div className="ml-11 flex items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs">ME</AvatarFallback>
          </Avatar>
          <Input
            autoFocus
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
            className="flex-1"
          />
          <Button size="icon-sm" onClick={handleSend} disabled={sending || !replyText.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function InboxPage() {
  const [view, setView] = React.useState<"inbox" | "unread" | "archived">("inbox")
  const [notifications, setNotifications] = React.useState<NotificationDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const load = React.useCallback((v: typeof view) => {
    setLoading(true)
    fetch(`/api/notifications?view=${v}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setNotifications(json.notifications)
          setUnreadCount(json.unreadCount)
        } else {
          toast.error(json.error || "Failed to load notifications")
        }
      })
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load(view)
  }, [view, load])

  async function patchNotification(id: string, data: Record<string, unknown>) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...data } : n))
    )
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to update")
      load(view)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notification")
      load(view)
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      load(view)
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  async function handleReply(notification: NotificationDTO, content: string) {
    if (!notification.taskId) return
    try {
      const res = await fetch(`/api/tasks/${notification.taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          parentId: notification.commentId ?? undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to send reply")
      toast.success("Reply sent")
      await patchNotification(notification.id, { read: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply")
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Inbox"
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-xl border">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                <InboxIcon className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
              <p className="mt-1 text-xs">Mentions, replies, and task updates will show up here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onToggleRead={(id, read) => patchNotification(id, { read })}
                onToggleArchive={(id, archived) => patchNotification(id, { archived })}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
