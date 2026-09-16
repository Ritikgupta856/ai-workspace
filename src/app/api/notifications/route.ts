import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"

const selectNotification = {
  id: true,
  type: true,
  title: true,
  message: true,
  read: true,
  readAt: true,
  archived: true,
  archivedAt: true,
  createdAt: true,
  taskId: true,
  commentId: true,
  task: { select: { id: true, title: true, projectId: true } },
  comment: { select: { id: true, content: true, parentId: true } },
  actor: { select: { id: true, name: true, email: true, image: true } },
} as const

function formatNotification(n: {
  id: string
  type: string
  title: string | null
  message: string | null
  read: boolean
  readAt: Date | null
  archived: boolean
  archivedAt: Date | null
  createdAt: Date
  taskId: string | null
  commentId: string | null
  task: { id: string; title: string; projectId: string | null } | null
  comment: { id: string; content: string; parentId: string | null } | null
  actor: { id: string; name: string | null; email: string; image: string | null } | null
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    archived: n.archived,
    createdAt: n.createdAt.toISOString(),
    taskId: n.taskId,
    commentId: n.commentId,
    task: n.task,
    comment: n.comment,
    actor: n.actor
      ? { id: n.actor.id, name: n.actor.name || n.actor.email, image: n.actor.image }
      : null,
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const view = new URL(req.url).searchParams.get("view") ?? "inbox"
    const where =
      view === "archived"
        ? { userId: ctx.session.user.id, archived: true }
        : view === "unread"
          ? { userId: ctx.session.user.id, archived: false, read: false }
          : { userId: ctx.session.user.id, archived: false }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: selectNotification,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({
        where: { userId: ctx.session.user.id, archived: false, read: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      notifications: notifications.map(formatNotification),
      unreadCount,
    })
  } catch (error) {
    console.error("Fetch Notifications Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load notifications." },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const body = await req.json()

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: ctx.session.user.id, read: false },
        data: { read: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    const id = String(body.id ?? "")
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification id is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.notification.findFirst({
      where: { id, userId: ctx.session.user.id },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      )
    }

    const data: { read?: boolean; readAt?: Date | null; archived?: boolean; archivedAt?: Date | null } = {}
    if (typeof body.read === "boolean") {
      data.read = body.read
      data.readAt = body.read ? new Date() : null
    }
    if (typeof body.archived === "boolean") {
      data.archived = body.archived
      data.archivedAt = body.archived ? new Date() : null
    }

    const notification = await prisma.notification.update({
      where: { id },
      data,
      select: selectNotification,
    })

    return NextResponse.json({ success: true, notification: formatNotification(notification) })
  } catch (error) {
    console.error("Update Notification Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update notification." },
      { status: 500 }
    )
  }
}
