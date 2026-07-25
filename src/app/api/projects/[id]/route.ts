import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { formatProject, isProjectStatus, projectInclude } from "@/lib/projects"

export async function GET(
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

    const project = await prisma.project.findFirst({
      where: { id, workspaceId: membership.workspaceId },
      include: {
        _count: {
          select: { tasks: true, documents: true, chats: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const [doneTasks, members, integrationCount] = await Promise.all([
      prisma.task.count({ where: { projectId: id, status: "DONE" } }),
      prisma.workspaceMember.findMany({
        where: { workspaceId: membership.workspaceId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.integration.count({
        where: { workspaceId: membership.workspaceId },
      }),
    ])

    const formatted = formatProject(project, {
      doneTasks,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      })),
      integrationCount,
    })

    return NextResponse.json({ success: true, project: formatted })
  } catch (error) {
    console.error("Get Project Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load project" },
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

    const existing = await prisma.project.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { name, description, status, icon } = body

    // Status and icon used to be silently dropped here, which is why Archive
    // and the status picker in the create dialog never did anything.
    if (status !== undefined && !isProjectStatus(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid project status" },
        { status: 400 }
      )
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(status !== undefined && { status }),
        ...(icon !== undefined && { icon: icon || null }),
      },
      include: projectInclude,
    })

    const statusChanged = status !== undefined && status !== existing.status
    await logActivity({
      type: statusChanged ? "PROJECT_STATUS_CHANGED" : "PROJECT_UPDATED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      projectId: id,
      metadata: {
        target: project.name,
        ...(statusChanged ? { from: existing.status, to: status } : {}),
      },
    })

    const [doneTasks, members, integrationCount] = await Promise.all([
      prisma.task.count({ where: { projectId: id, status: "DONE" } }),
      prisma.workspaceMember.findMany({
        where: { workspaceId: membership.workspaceId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.integration.count({
        where: { workspaceId: membership.workspaceId },
      }),
    ])

    const formatted = formatProject(project, {
      doneTasks,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      })),
      integrationCount,
    })

    return NextResponse.json({ success: true, project: formatted })
  } catch (error) {
    console.error("Update Project Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update project." },
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

    const existing = await prisma.project.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    await prisma.project.delete({ where: { id } })

    // Deliberately not scoped to projectId — the project row is gone, and the
    // cascade would take the activity row with it.
    await logActivity({
      type: "PROJECT_DELETED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      metadata: { target: existing.name },
    })

    return NextResponse.json({ success: true, message: "Project deleted." })
  } catch (error) {
    console.error("Delete Project Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete project." },
      { status: 500 }
    )
  }
}
