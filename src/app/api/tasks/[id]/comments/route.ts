import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireTask } from "@/lib/api/guards"
import { logActivity } from "@/lib/activity"
import {
  extractMentionedUserIds,
  notifyCommentReply,
  notifyMention,
} from "@/lib/notifications"

const commentSelect = {
  id: true,
  taskId: true,
  content: true,
  parentId: true,
  editedAt: true,
  createdAt: true,
  author: { select: { id: true, name: true, email: true, image: true } },
} as const

function formatComment(comment: {
  id: string
  taskId: string
  content: string
  parentId: string | null
  editedAt: Date | null
  createdAt: Date
  author: { id: string; name: string | null; email: string; image: string | null }
}) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    content: comment.content,
    parentId: comment.parentId,
    edited: comment.editedAt !== null,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name || comment.author.email,
      image: comment.author.image,
    },
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireTask(id)
    if (ctx.error) return ctx.error

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      select: commentSelect,
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ success: true, comments: comments.map(formatComment) })
  } catch (error) {
    console.error("Fetch Task Comments Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load comments." },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireTask(id)
    if (ctx.error) return ctx.error

    const body = await req.json()
    const content = String(body.content ?? "").trim()
    const parentId = body.parentId ? String(body.parentId) : null

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Comment content is required" },
        { status: 400 }
      )
    }

    let parent: { id: string; authorId: string } | null = null
    if (parentId) {
      parent = await prisma.taskComment.findFirst({
        where: { id: parentId, taskId: id },
        select: { id: true, authorId: true },
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorId: ctx.session.user.id,
        content,
        parentId,
      },
      select: commentSelect,
    })

    await logActivity({
      type: "TASK_UPDATED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId: ctx.task.projectId ?? undefined,
      taskId: id,
      description: `commented on ${ctx.task.title}`,
      metadata: { target: ctx.task.title },
    })

    if (parent && parent.authorId !== ctx.session.user.id) {
      await notifyCommentReply({
        recipientId: parent.authorId,
        actorId: ctx.session.user.id,
        taskId: id,
        commentId: comment.id,
        taskTitle: ctx.task.title,
      })
    } else if (!parent && ctx.task.assigneeId) {
      // Top-level comment: surface it to the assignee as an update, same as
      // any other task change they didn't make themselves.
      await notifyCommentReply({
        recipientId: ctx.task.assigneeId,
        actorId: ctx.session.user.id,
        taskId: id,
        commentId: comment.id,
        taskTitle: ctx.task.title,
      })
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    const mentionedIds = extractMentionedUserIds(
      content,
      members.map((m) => m.user)
    )
    for (const userId of mentionedIds) {
      await notifyMention({
        recipientId: userId,
        actorId: ctx.session.user.id,
        taskId: id,
        commentId: comment.id,
        taskTitle: ctx.task.title,
      })
    }

    return NextResponse.json(
      { success: true, comment: formatComment(comment) },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Task Comment Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to post comment." },
      { status: 500 }
    )
  }
}
