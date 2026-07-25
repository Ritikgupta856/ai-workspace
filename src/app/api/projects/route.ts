import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import {
  formatProject,
  isProjectStatus,
  projectInclude,
} from "@/lib/projects"

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

    const workspaceId = membership.workspaceId

    const [projects, doneGroups, members, integrationCount] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId },
        include: projectInclude,
        orderBy: { updatedAt: "desc" },
      }),
      // One grouped count instead of a per-project query in a loop.
      prisma.task.groupBy({
        by: ["projectId"],
        where: { workspaceId, status: "DONE", projectId: { not: null } },
        _count: { _all: true },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.integration.count({ where: { workspaceId } }),
    ])

    const doneByProject = new Map(
      doneGroups.map((g) => [g.projectId as string, g._count._all])
    )

    // Access is workspace-wide in the current schema, so every member can see
    // every project. Surfacing them here keeps the avatars on the card honest.
    const memberSummaries = members.map((m) => ({
      id: m.user.id,
      name: m.user.name || m.user.email,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
    }))

    const formatted = projects.map((project) =>
      formatProject(project, {
        doneTasks: doneByProject.get(project.id) ?? 0,
        members: memberSummaries,
        integrationCount,
      })
    )

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
    const { name, description, icon, status } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      )
    }

    if (status !== undefined && !isProjectStatus(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid project status" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        status: status || "ACTIVE",
        workspaceId: membership.workspaceId,
      },
      include: projectInclude,
    })

    await logActivity({
      type: "PROJECT_CREATED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      projectId: project.id,
      description: `created project ${project.name}`,
      metadata: { name: project.name, target: project.name },
    })

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    const formatted = formatProject(project, {
      doneTasks: 0,
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      })),
      integrationCount: await prisma.integration.count({
        where: { workspaceId: membership.workspaceId },
      }),
    })

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
