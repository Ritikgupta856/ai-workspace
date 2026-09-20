import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
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

    const searchParams = new URL(req.url).searchParams
    const mine = searchParams.get("assignee") === "me"
    const projectId = searchParams.get("projectId")

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: membership.workspaceId,
        ...(mine ? { assigneeId: session.user.id } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, image: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const formatted = tasks.map((task) => ({
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
    }))

    return NextResponse.json({ success: true, tasks: formatted })
  } catch (error) {
    console.error("Fetch Tasks Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks." },
      { status: 500 }
    )
  }
}
