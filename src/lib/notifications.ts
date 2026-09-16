import { prisma } from "@/lib/prisma"
import type { NotificationType } from "@/generated/prisma/client"

interface CreateNotificationParams {
  userId: string
  actorId?: string | null
  type: NotificationType
  taskId?: string | null
  commentId?: string | null
  title?: string
  message?: string
}

/** Never notify someone about their own action. */
export async function createNotification({
  userId,
  actorId,
  type,
  taskId,
  commentId,
  title,
  message,
}: CreateNotificationParams) {
  if (actorId && actorId === userId) return

  try {
    await prisma.notification.create({
      data: {
        userId,
        actorId: actorId ?? null,
        type,
        taskId: taskId ?? null,
        commentId: commentId ?? null,
        title,
        message,
      },
    })
  } catch (error) {
    // Notifications must never break the request that triggered them.
    console.error("Failed to create notification:", error)
  }
}

export async function notifyTaskAssignment({
  assigneeId,
  actorId,
  taskId,
  taskTitle,
}: {
  assigneeId: string
  actorId: string
  taskId: string
  taskTitle: string
}) {
  await createNotification({
    userId: assigneeId,
    actorId,
    type: "TASK_ASSIGNMENT",
    taskId,
    title: "You were assigned a task",
    message: taskTitle,
  })
}

export async function notifyTaskUpdate({
  recipientId,
  actorId,
  taskId,
  taskTitle,
}: {
  recipientId: string
  actorId: string
  taskId: string
  taskTitle: string
}) {
  await createNotification({
    userId: recipientId,
    actorId,
    type: "TASK_UPDATE",
    taskId,
    title: "Task updated",
    message: taskTitle,
  })
}

export async function notifyTaskCompletion({
  recipientId,
  actorId,
  taskId,
  taskTitle,
}: {
  recipientId: string
  actorId: string
  taskId: string
  taskTitle: string
}) {
  await createNotification({
    userId: recipientId,
    actorId,
    type: "TASK_COMPLETION",
    taskId,
    title: "Task completed",
    message: taskTitle,
  })
}

export async function notifyCommentReply({
  recipientId,
  actorId,
  taskId,
  commentId,
  taskTitle,
}: {
  recipientId: string
  actorId: string
  taskId: string
  commentId: string
  taskTitle: string
}) {
  await createNotification({
    userId: recipientId,
    actorId,
    type: "COMMENT_REPLY",
    taskId,
    commentId,
    title: "New reply",
    message: taskTitle,
  })
}

export async function notifyMention({
  recipientId,
  actorId,
  taskId,
  commentId,
  taskTitle,
}: {
  recipientId: string
  actorId: string
  taskId: string
  commentId?: string | null
  taskTitle: string
}) {
  await createNotification({
    userId: recipientId,
    actorId,
    type: "MENTION",
    taskId,
    commentId,
    title: "You were mentioned",
    message: taskTitle,
  })
}

/** Scans comment text for `@Name` tokens and resolves them against workspace members. */
export function extractMentionedUserIds(
  content: string,
  members: { id: string; name: string | null; email: string }[]
): string[] {
  const matches = content.match(/@([a-zA-Z0-9._-]+)/g)
  if (!matches) return []

  const handles = new Set(matches.map((m) => m.slice(1).toLowerCase()))
  const ids = new Set<string>()

  for (const member of members) {
    const nameHandle = member.name?.toLowerCase().replace(/\s+/g, "")
    const emailHandle = member.email.split("@")[0]?.toLowerCase()
    if (
      (nameHandle && handles.has(nameHandle)) ||
      (emailHandle && handles.has(emailHandle))
    ) {
      ids.add(member.id)
    }
  }

  return Array.from(ids)
}
