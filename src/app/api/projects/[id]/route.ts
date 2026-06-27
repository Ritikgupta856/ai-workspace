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
    const { name, description } = body

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
            documents: true,
            chats: true,
          },
        },
      },
    })

    const formatted = {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      status: "ACTIVE",
      progress: 0,
      taskCount: project._count.tasks,
      documentCount: project._count.documents,
      chatCount: project._count.chats,
      integrationCount: 0,
      members: [],
      updatedAt: project.updatedAt.toISOString(),
      favorite: false,
      icon: "📁",
    }

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

    return NextResponse.json({ success: true, message: "Project deleted." })
  } catch (error) {
    console.error("Delete Project Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete project." },
      { status: 500 }
    )
  }
}
