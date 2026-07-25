import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireProject } from "@/lib/api/guards"
import { logActivity } from "@/lib/activity"

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

function formatTask(task: {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  labels: string[]
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
  assignee: { id: string; name: string | null; image: string | null } | null
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    labels: task.labels,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name ?? "Unknown",
          image: task.assignee.image,
        }
      : null,
  }
}

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  labels: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, image: true } },
} as const

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const status = new URL(req.url).searchParams.get("status")

    const tasks = await prisma.task.findMany({
      where: {
        projectId: id,
        ...(status && STATUSES.includes(status as (typeof STATUSES)[number])
          ? { status: status as (typeof STATUSES)[number] }
          : {}),
      },
      select: taskSelect,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    })

    return NextResponse.json({
      success: true,
      tasks: tasks.map(formatTask),
    })
  } catch (error) {
    console.error("Project Tasks Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load tasks." },
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
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const body = await req.json()
    const { title, description, status, priority, assigneeId, dueDate } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      )
    }

    if (status && !STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid task status" },
        { status: 400 }
      )
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, error: "Invalid task priority" },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: id,
        workspaceId: ctx.workspaceId,
        createdById: ctx.session.user.id,
      },
      select: taskSelect,
    })

    await logActivity({
      type: "TASK_CREATED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId: id,
      description: `created task ${task.title}`,
      metadata: { target: task.title },
    })

    return NextResponse.json(
      { success: true, task: formatTask(task) },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Project Task Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create task." },
      { status: 500 }
    )
  }
}
