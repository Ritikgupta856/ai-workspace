import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { formatProject, projectInclude } from "@/lib/projects"

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

    const [projects, doneGroups, integrationCount] = await Promise.all([
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
      prisma.integration.count({ where: { workspaceId } }),
    ])

    const doneByProject = new Map(
      doneGroups.map((g) => [g.projectId as string, g._count._all])
    )

    // Each project's own members, not the whole workspace roster — one
    // grouped query instead of N, same pattern as doneByProject above.
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: { in: projects.map((p) => p.id) } },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })
    const membersByProject = new Map<string, typeof projectMembers>()
    for (const pm of projectMembers) {
      const list = membersByProject.get(pm.projectId) ?? []
      list.push(pm)
      membersByProject.set(pm.projectId, list)
    }

    const formatted = projects.map((project) =>
      formatProject(project, {
        doneTasks: doneByProject.get(project.id) ?? 0,
        members: (membersByProject.get(project.id) ?? []).map((m) => ({
          id: m.user.id,
          name: m.user.name || m.user.email,
          email: m.user.email,
          image: m.user.image,
          role: m.role,
        })),
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
    const { name, description, icon } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
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

    // The creator is the project's first (and initially only) member.
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: session.user.id, role: "OWNER" },
    })

    const formatted = formatProject(project, {
      doneTasks: 0,
      members: [
        {
          id: session.user.id,
          name: session.user.name || session.user.email,
          email: session.user.email,
          image: session.user.image ?? null,
          role: "OWNER",
        },
      ],
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
