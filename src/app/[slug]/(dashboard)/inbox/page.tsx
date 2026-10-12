"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  AtSign,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  MessageSquare,
  Pencil,
  Send,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { useAddTaskComment } from "@/lib/query/tasks"
import {
  useMarkAllRead,
  useNotifications,
  usePatchNotification,
  type InboxView,
  type NotificationDTO,
  type NotificationType,
} from "@/lib/query/notifications"

import { SectionHeader } from "@/components/dashboard/section-header"
import { SearchCommand } from "@/components/layout/search-command"
import { ThemeToggle } from "@/components/common/theme-menu"
import { PersonAvatar } from "@/components/tasks/task-grouped-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InboxSkeleton } from "@/components/dashboard/loading-states"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: typeof AtSign; className: string }> = {
  MENTION: { label: "Mention", icon: AtSign, className: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  COMMENT_REPLY: { label: "Reply", icon: MessageSquare, className: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  TASK_ASSIGNMENT: { label: "Assigned", icon: UserPlus, className: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  TASK_UPDATE: { label: "Update", icon: Pencil, className: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  TASK_COMPLETION: { label: "Completed", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
}

type TabKey = "all" | "mentions" | "assignments" | "comments" | "updates"

const TABS: { value: TabKey; label: string; types: NotificationType[] | null }[] = [
  { value: "all", label: "All", types: null },
  { value: "mentions", label: "Mentions", types: ["MENTION"] },
  { value: "assignments", label: "Assignments", types: ["TASK_ASSIGNMENT"] },
  { value: "comments", label: "Comments", types: ["COMMENT_REPLY"] },
  { value: "updates", label: "Updates", types: ["TASK_UPDATE", "TASK_COMPLETION"] },
]

const EMPTY_NOTIFICATIONS: NotificationDTO[] = []

function actorName(n: NotificationDTO) {
  return n.actor?.name ?? null
}

function IconAction({
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
    "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link href={href} className={className} aria-label={label}>
            <Icon className="size-4" />
          </Link>
        ) : (
          <button type="button" onClick={onClick} className={className} aria-label={label}>
            <Icon className="size-4" />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ── List row ───────────────────────────────────────────────── */

function NotificationItem({
  notification,
  selected,
  onSelect,
  onToggleRead,
}: {
  notification: NotificationDTO
  selected: boolean
  onSelect: () => void
  onToggleRead: () => void
}) {
  const config = TYPE_CONFIG[notification.type]
  const TypeIcon = config.icon
  const name = actorName(notification)
  const preview = notification.comment?.content ?? notification.message

  return (
    <div
      className={cn(
        "group relative border-b border-border/70 transition-colors",
        selected ? "bg-accent/60" : "hover:bg-muted/40"
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 px-5 py-4 pr-14 text-left">
        {!notification.read && (
          <span className="absolute top-8 left-2 size-1.5 rounded-full bg-primary" aria-label="Unread" />
        )}
        {name ? (
          <PersonAvatar name={name} image={notification.actor?.image} className="size-8 shrink-0 ring-0" />
        ) : (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", config.className)}>
            <TypeIcon className="size-4" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {name && <span className="font-medium text-foreground">{name} </span>}
            <span className={cn(!name && "font-medium text-foreground")}>
              {notification.title || config.label}
            </span>
          </p>
          {preview && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{preview}</p>}
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <TypeIcon className="size-3 shrink-0" />
            {notification.task && <span className="truncate">{notification.task.title}</span>}
            {notification.task && <span aria-hidden>·</span>}
            <span className="shrink-0" suppressHydrationWarning>
              {formatUpdatedDate(notification.createdAt)}
            </span>
          </div>
        </div>
      </button>

      <div className="absolute top-3 right-4 opacity-60 transition-opacity group-hover:opacity-100">
        <IconAction
          label={notification.read ? "Mark unread" : "Mark read"}
          icon={notification.read ? Mail : MailOpen}
          onClick={onToggleRead}
        />
      </div>
    </div>
  )
}

/* ── Detail pane ────────────────────────────────────────────── */

function NotificationDetail({
  notification,
  onBack,
  onToggleRead,
  onToggleArchive,
  onReply,
}: {
  notification: NotificationDTO
  onBack: () => void
  onToggleRead: () => void
  onToggleArchive: () => void
  onReply: (notification: NotificationDTO, content: string) => Promise<void>
}) {
  const slug = useParams().slug as string
  const config = TYPE_CONFIG[notification.type]
  const name = actorName(notification)
  const [replyText, setReplyText] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const canReply =
    notification.taskId && (notification.type === "COMMENT_REPLY" || notification.type === "MENTION")

  const taskHref = notification.taskId
    ? notification.task?.projectId
      ? `/${slug}/projects/${notification.task.projectId}/tasks?task=${notification.taskId}`
      : `/${slug}/my-work?task=${notification.taskId}`
    : null

  async function handleSend() {
    const content = replyText.trim()
    if (!content) return
    setSending(true)
    try {
      await onReply(notification, content)
      setReplyText("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to list"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", config.className)}>{config.label}</span>
        <div className="ml-auto flex items-center gap-0.5">
          {taskHref && <IconAction label="Open task" icon={ExternalLink} href={taskHref} />}
          <IconAction
            label={notification.read ? "Mark unread" : "Mark read"}
            icon={notification.read ? Mail : MailOpen}
            onClick={onToggleRead}
          />
          <IconAction
            label={notification.archived ? "Unarchive" : "Archive"}
            icon={notification.archived ? ArchiveRestore : Archive}
            onClick={onToggleArchive}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex items-start gap-3">
            {name ? (
              <PersonAvatar name={name} image={notification.actor?.image} className="size-9 shrink-0 ring-0" />
            ) : (
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", config.className)}>
                <config.icon className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-base leading-6 text-muted-foreground">
                {name && <span className="font-semibold text-foreground">{name} </span>}
                <span className={cn(!name && "font-semibold text-foreground")}>
                  {notification.title || config.label}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {formatUpdatedDate(notification.createdAt)}
              </p>
            </div>
          </div>

          {notification.task && (
            <div className="rounded-xl border border-border/80 bg-card px-4 py-3 shadow-xs">
              <p className="text-xs text-muted-foreground">Task</p>
              <p className="mt-0.5 text-sm font-medium">{notification.task.title}</p>
            </div>
          )}

          {notification.message && <p className="text-sm leading-6">{notification.message}</p>}

          {notification.comment && (
            <blockquote className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-sm leading-6">
              {notification.comment.content}
            </blockquote>
          )}

          {canReply && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend()
                }}
                className="h-9 flex-1 rounded-lg text-[13px] shadow-none"
              />
              <Button
                size="icon-sm"
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                className="size-9 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                aria-label="Send reply"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */

export default function InboxPage() {
  const [unreadOnly, setUnreadOnly] = React.useState(false)
  const [showArchived, setShowArchived] = React.useState(false)
  const [tab, setTab] = React.useState<TabKey>("all")
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const view: InboxView = showArchived ? "archived" : unreadOnly ? "unread" : "inbox"
  const { data, isPending: loading, error } = useNotifications(view)
  const notifications = data?.notifications ?? EMPTY_NOTIFICATIONS
  const unreadCount = data?.unreadCount ?? 0
  const patch = usePatchNotification()
  const markAllRead = useMarkAllRead()
  const addComment = useAddTaskComment()

  React.useEffect(() => {
    if (error) toast.error(error.message || "Failed to load notifications")
  }, [error])

  // Per-tab counts are the notifications still waiting on you in this view.
  const tabCounts = React.useMemo(() => {
    const counts = {} as Record<TabKey, number>
    for (const t of TABS) {
      counts[t.value] = notifications.filter((n) => !n.read && (!t.types || t.types.includes(n.type))).length
    }
    return counts
  }, [notifications])

  const visible = React.useMemo(() => {
    const types = TABS.find((t) => t.value === tab)?.types
    return types ? notifications.filter((n) => types.includes(n.type)) : notifications
  }, [notifications, tab])

  const selected = visible.find((n) => n.id === selectedId) ?? null

  const patchNotification = (id: string, changes: { read?: boolean; archived?: boolean }) =>
    patch.mutateAsync({ id, ...changes }).catch(() => {})

  function handleSelect(n: NotificationDTO) {
    setSelectedId(n.id)
    if (!n.read) void patchNotification(n.id, { read: true })
  }

  async function handleReply(notification: NotificationDTO, content: string) {
    if (!notification.taskId) return
    try {
      await addComment.mutateAsync({
        taskId: notification.taskId,
        content,
        parentId: notification.commentId ?? undefined,
      })
      toast.success("Reply sent")
      await patchNotification(notification.id, { read: true })
    } catch {
      // the mutation already showed why it failed
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader icon={InboxIcon} title="Inbox">
        <SearchCommand variant="header" />
        <ThemeToggle />
      </SectionHeader>

      <div className="flex min-h-0 flex-1">
        {/* List */}
        <div
          className={cn(
            "min-h-0 w-full flex-col border-border/70 md:flex md:w-[420px] md:shrink-0 md:border-r lg:w-[525px]",
            selected ? "hidden" : "flex"
          )}
        >
          <div className="shrink-0 border-b border-border/70 px-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
                  <Switch
                    checked={unreadOnly}
                    onCheckedChange={setUnreadOnly}
                    disabled={showArchived}
                    aria-label="Show unread only"
                  />
                  Unread
                </label>
                <IconAction
                  label={showArchived ? "Back to inbox" : "View archived"}
                  icon={showArchived ? InboxIcon : Archive}
                  onClick={() => setShowArchived((v) => !v)}
                />
                <IconAction
                  label="Mark all read"
                  icon={CheckCheck}
                  onClick={() => unreadCount > 0 && markAllRead.mutate()}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-5 overflow-x-auto">
              {TABS.map((t) => {
                const active = tab === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    className={cn(
                      "-mb-px inline-flex h-9 shrink-0 items-center gap-1 border-b-2 text-[13px] transition-colors",
                      active
                        ? "border-foreground font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                    {tabCounts[t.value] > 0 && (
                      <span className="text-xs text-muted-foreground">{tabCounts[t.value]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3">
                <InboxSkeleton />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-24 text-center">
                <InboxIcon className="mb-1 size-7 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  {showArchived ? "Nothing archived" : "You're all caught up"}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Mentions, replies, and task updates will show up here.
                </p>
              </div>
            ) : (
              visible.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  selected={n.id === selectedId}
                  onSelect={() => handleSelect(n)}
                  onToggleRead={() => patchNotification(n.id, { read: !n.read })}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className={cn("min-w-0 flex-1 flex-col md:flex", selected ? "flex" : "hidden")}>
          {selected ? (
            <NotificationDetail
              notification={selected}
              onBack={() => setSelectedId(null)}
              onToggleRead={() => patchNotification(selected.id, { read: !selected.read })}
              onToggleArchive={() => {
                patchNotification(selected.id, { archived: !selected.archived })
                setSelectedId(null)
              }}
              onReply={handleReply}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <MailOpen className="mb-1 size-7 text-muted-foreground" />
              <p className="text-[15px] font-semibold text-foreground">Select a notification</p>
              <p className="text-[13px] text-muted-foreground">
                Read the conversation and reply without leaving your inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
