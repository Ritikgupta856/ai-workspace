import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TaskPriority, TaskStatus } from "@/generated/prisma/enums"

export async function POST(req: Request) {
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

    const body = await req.json()
    const {
      title,
      description,
      projectId,
      priority,
      status,
      assigneeId,
      dueDate,
      labels,
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        projectId: projectId ?? null,
        priority: priority ?? TaskPriority.MEDIUM,
        status: status ?? TaskStatus.TODO,
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId: membership.workspaceId,
        createdById: session.user.id,
        labels: labels ?? [],
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
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name ?? "Unassigned",
      assigneeId: task.assigneeId,
      labels: task.labels,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      updatedAt: task.updatedAt.toISOString(),
    }

    return NextResponse.json(
      { success: true, message: "Task created successfully.", task: formatted },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create task." },
      { status: 500 }
    )
  }
}
