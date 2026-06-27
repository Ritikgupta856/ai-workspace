import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    const projects = await prisma.project.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        _count: {
          select: {
            tasks: true,
            documents: true,
            chats: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const formatted = projects.map((project) => ({
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
    }))

    return NextResponse.json({ success: true, projects: formatted })
  } catch (error) {
    console.error("Fetch Projects Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects." },
      { status: 500 }
    )
  }
}

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
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        workspaceId: membership.workspaceId,
      },
    })

    const formatted = {
      id: project.id,
      name: project.name,
      description: project.description ?? "",
      status: "ACTIVE",
      progress: 0,
      taskCount: 0,
      documentCount: 0,
      chatCount: 0,
      integrationCount: 0,
      members: [],
      updatedAt: project.updatedAt.toISOString(),
      favorite: false,
      icon: "📁",
    }

    return NextResponse.json(
      { success: true, project: formatted },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Project Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create project." },
      { status: 500 }
    )
  }
}
