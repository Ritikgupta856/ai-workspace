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
  Search,
  X,
  Mail,
  MailOpen,
  ExternalLink,
  Reply,
  CheckCheck,
} from "lucide-react"
import { toast } from "sonner"
import { requestSidebarRefresh } from "@/lib/sidebar-events"

import { HeaderButton, HeaderSearchButton, SectionHeader } from "@/components/dashboard/section-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

function RowAction({
  label,
  icon: Icon,
  onClick,
  href,
}: {
  label: string
  icon: typeof AtSign
  onClick?: () => void
  href?: string
}) {
  const className =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} className={className} aria-label={label}>
            <Icon className="size-3.5" />
          </Link>
        ) : (
          <button type="button" onClick={onClick} className={className} aria-label={label}>
            <Icon className="size-3.5" />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
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
        "group flex flex-col rounded-lg border border-transparent px-4 transition-colors hover:border-border hover:bg-muted/40",
        !notification.read && "bg-primary/[0.03]"
      )}
    >
      <div className="flex min-h-11 items-center gap-3 py-2">
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", config.className)}>
          <Icon className="size-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {!notification.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
            <span className="truncate text-sm leading-5 text-foreground">
              {notification.actor?.name ? (
                <span className="font-medium">{notification.actor.name} </span>
              ) : null}
              <span className={cn(!notification.actor?.name && "font-medium")}>
                {notification.title || config.label}
              </span>
              {notification.message ? (
                <span className="text-muted-foreground"> — {notification.message}</span>
              ) : null}
            </span>
          </div>
          {notification.comment && (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              &ldquo;{notification.comment.content}&rdquo;
            </p>
          )}
        </div>

        <span className="shrink-0 text-[13px] text-muted-foreground">
          {formatUpdatedDate(notification.createdAt)}
        </span>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {notification.taskId && (
            <RowAction label="Open task" icon={ExternalLink} href={`/tasks?task=${notification.taskId}`} />
          )}
          {canReply && (
            <RowAction label="Reply" icon={Reply} onClick={() => setReplying((v) => !v)} />
          )}
          <RowAction
            label={notification.read ? "Mark unread" : "Mark read"}
            icon={notification.read ? Mail : MailOpen}
            onClick={() => onToggleRead(notification.id, !notification.read)}
          />
          <RowAction
            label={notification.archived ? "Unarchive" : "Archive"}
            icon={notification.archived ? ArchiveRestore : Archive}
            onClick={() => onToggleArchive(notification.id, !notification.archived)}
          />
        </div>
      </div>

      {replying && (
        <div className="mb-2.5 ml-10 flex items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[10px]">ME</AvatarFallback>
          </Avatar>
          <Input
            autoFocus
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
              if (e.key === "Escape") setReplying(false)
            }}
            className="h-8 flex-1 rounded-lg text-[13px] shadow-none"
          />
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={sending || !replyText.trim()}
            className="size-8 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            <Send className="size-3.5" />
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
  const [search, setSearch] = React.useState("")
  const [searchOpen, setSearchOpen] = React.useState(false)

  const visible = React.useMemo(() => {
    if (!search.trim()) return notifications
    const q = search.toLowerCase()
    return notifications.filter((n) =>
      [n.title, n.message, n.actor?.name, n.comment?.content, n.task?.title]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(q))
    )
  }, [notifications, search])

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
      requestSidebarRefresh()
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
      requestSidebarRefresh()
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

  const tabs: { value: typeof view; label: string; count?: number }[] = [
    { value: "inbox", label: "Inbox" },
    { value: "unread", label: "Unread", count: unreadCount },
    { value: "archived", label: "Archived" },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader icon={InboxIcon} title="Inbox" count={unreadCount}>
        <HeaderSearchButton onClick={() => setSearchOpen(true)} />
        <HeaderButton icon={CheckCheck} onClick={handleMarkAllRead} disabled={unreadCount === 0}>
          Mark all read
        </HeaderButton>
      </SectionHeader>

      {/* Toolbar */}
      <div className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/70 px-5 py-1.5">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const active = view === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors",
                  active
                    ? "border border-border/80 bg-card font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count ? (
                  <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded border border-border/80 bg-card px-1 font-mono text-[10px] leading-none text-muted-foreground">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="h-8 w-48 rounded-lg border-border/80 pr-7 pl-7 text-[13px] shadow-none"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearch("")
                    setSearchOpen(false)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setSearchOpen(false)
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Close search"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8 rounded-lg border-border/80 shadow-none"
              onClick={() => setSearchOpen(true)}
              aria-label="Search notifications"
            >
              <Search className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-8">
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-24 text-center">
            <InboxIcon className="mb-1 size-7 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              {search ? `No notifications match "${search}"` : "You're all caught up"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {search ? "Try a different search." : "Mentions, replies, and task updates will show up here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid h-8 grid-cols-[minmax(0,1fr)_auto] items-center px-4 text-[13px] text-muted-foreground">
              <span>Notification</span>
              <span>When</span>
            </div>
            {visible.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onToggleRead={(id, read) => patchNotification(id, { read })}
                onToggleArchive={(id, archived) => patchNotification(id, { archived })}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
