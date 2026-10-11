import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"
import { commentSelect, formatComment } from "@/lib/task-comments"
import { logActivity } from "@/lib/activity"
import { notifyTaskAssignment, notifyTaskCompletion, notifyTaskUpdate } from "@/lib/notifications"

/**
 * One task. With `?panel=1` it also returns everything the task panel shows
 * — comments, the people it can be assigned to, and whether it is favourited —
 * queried in parallel after a single auth check, so opening the panel is one
 * request instead of four chained ones.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { id } = await params
    const panel = new URL(req.url).searchParams.get("panel") === "1"
    const userId = ctx.session.user.id

    const taskQuery = prisma.task.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, image: true } },
        createdBy: { select: { name: true, email: true } },
        parentTask: { select: { id: true, title: true } },
        subtasks: { select: { id: true, title: true, status: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    })

    // The panel extras don't depend on the task row, so they run alongside it.
    // Assignable people are the task's project members, or the whole workspace
    // for a project-less task; both are cheap, so fetch both and pick after.
    const [task, comments, projectMembers, workspaceMembers, favorite] = await Promise.all([
      taskQuery,
      panel
        ? prisma.taskComment.findMany({ where: { taskId: id }, select: commentSelect, orderBy: { createdAt: "asc" } })
        : null,
      panel
        ? prisma.projectMember.findMany({
            where: { project: { workspaceId: ctx.workspaceId, tasks: { some: { id } } } },
            select: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: "asc" },
          })
        : null,
      panel
        ? prisma.workspaceMember.findMany({
            where: { workspaceId: ctx.workspaceId },
            select: { user: { select: { id: true, name: true, email: true, image: true } } },
            orderBy: { createdAt: "asc" },
          })
        : null,
      panel
        ? prisma.favorite.findUnique({
            where: { userId_entityType_entityId: { userId, entityType: "TASK", entityId: id } },
            select: { id: true },
          })
        : null,
    ])

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      project: task.project?.name ?? null,
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name ?? "Unassigned",
      assigneeId: task.assigneeId,
      assigneeImage: task.assignee?.image ?? null,
      commentCount: task._count.comments,
      subtaskCount: task._count.subtasks,
      labels: task.labels,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      updatedAt: task.updatedAt.toISOString(),
      parentTaskId: task.parentTaskId,
      parent: task.parentTask,
      subtasks: task.subtasks,
      createdBy: task.createdBy.name || task.createdBy.email,
      createdAt: task.createdAt.toISOString(),
    }

    if (!panel) return NextResponse.json({ success: true, task: formatted })

    const members = task.projectId
      ? projectMembers!.map(({ user }) => ({ userId: user.id, name: user.name || user.email, avatar: user.image }))
      : workspaceMembers!.map(({ user }) => ({
          userId: user.id,
          name: user.name || user.email.split("@")[0],
          avatar: user.image,
        }))

    return NextResponse.json({
      success: true,
      task: formatted,
      comments: comments!.map(formatComment),
      members,
      favorited: favorite !== null,
    })
  } catch (error) {
    console.error("Fetch Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch task." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    const { id } = await params

    const existing = await prisma.task.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      projectId,
      dueDate,
      labels,
      parentTaskId,
    } = body

    if (parentTaskId !== undefined && parentTaskId === id) {
      return NextResponse.json(
        { success: false, error: "A task can't be its own parent." },
        { status: 400 }
      )
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(projectId !== undefined && { projectId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(labels !== undefined && { labels }),
        ...(parentTaskId !== undefined && { parentTaskId }),
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, image: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    })

    // Emit the most specific event the change represents, so the task
    // timeline reads as a story rather than a wall of "updated task".
    const base = {
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      projectId: task.projectId ?? undefined,
      taskId: task.id,
    }

    if (status !== undefined && status !== existing.status) {
      await logActivity({
        ...base,
        type: status === "DONE" ? "TASK_COMPLETED" : "TASK_STATUS_CHANGED",
        metadata: {
          target: task.title,
          from: existing.status,
          to: status,
        },
      })
      if (status === "DONE" && task.createdById) {
        await notifyTaskCompletion({
          recipientId: task.createdById,
          actorId: session.user.id,
          taskId: task.id,
          taskTitle: task.title,
        })
      }
    } else if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
      await logActivity({
        ...base,
        type: "TASK_ASSIGNED",
        metadata: {
          target: task.title,
          to: task.assignee?.name ?? undefined,
        },
      })
      if (assigneeId) {
        await notifyTaskAssignment({
          assigneeId,
          actorId: session.user.id,
          taskId: task.id,
          taskTitle: task.title,
        })
      }
    } else {
      await logActivity({
        ...base,
        type: "TASK_UPDATED",
        metadata: { target: task.title },
      })
      if (task.assigneeId) {
        await notifyTaskUpdate({
          recipientId: task.assigneeId,
          actorId: session.user.id,
          taskId: task.id,
          taskTitle: task.title,
        })
      }
    }

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      project: task.project?.name ?? null,
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name ?? "Unassigned",
      assigneeId: task.assigneeId,
      assigneeImage: task.assignee?.image ?? null,
      commentCount: task._count.comments,
      subtaskCount: task._count.subtasks,
      labels: task.labels,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      updatedAt: task.updatedAt.toISOString(),
      parentTaskId: task.parentTaskId,
    }

    return NextResponse.json({ success: true, task: formatted })
  } catch (error) {
    console.error("Update Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update task." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    const { id } = await params

    const existing = await prisma.task.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      )
    }

    await prisma.task.delete({ where: { id } })

    await logActivity({
      type: "TASK_DELETED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      projectId: existing.projectId ?? undefined,
      taskId: existing.id,
      metadata: { target: existing.title },
    })

    return NextResponse.json({ success: true, message: "Task deleted." })
  } catch (error) {
    console.error("Delete Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete task." },
      { status: 500 }
    )
  }
}
