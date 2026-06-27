import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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
    } = body

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
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    })

    const formatted = {
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      project: task.project?.name ?? null,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name ?? "Unassigned",
      labels: task.labels,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      updatedAt: task.updatedAt.toISOString(),
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

    return NextResponse.json({ success: true, message: "Task deleted." })
  } catch (error) {
    console.error("Delete Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete task." },
      { status: 500 }
    )
  }
}
