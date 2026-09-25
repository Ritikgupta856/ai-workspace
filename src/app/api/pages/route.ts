import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"
import { logActivity } from "@/lib/activity"

const pageSelect = {
  id: true,
  workspaceId: true,
  projectId: true,
  title: true,
  icon: true,
  coverImage: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true, image: true } },
} as const

function formatPage(page: {
  id: string
  workspaceId: string
  projectId: string
  title: string
  icon: string | null
  coverImage: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string | null; email: string; image: string | null }
}) {
  return {
    id: page.id,
    workspaceId: page.workspaceId,
    projectId: page.projectId,
    title: page.title,
    icon: page.icon,
    coverImage: page.coverImage,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    createdBy: {
      id: page.createdBy.id,
      name: page.createdBy.name || page.createdBy.email,
      image: page.createdBy.image,
    },
  }
}

/** `?projectId=` is required: every page belongs to a project. */
export async function GET(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const projectId = new URL(req.url).searchParams.get("projectId")
    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 })
    }

    const pages = await prisma.page.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        projectId,
      },
      select: pageSelect,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, pages: pages.map(formatPage) })
  } catch (error) {
    console.error("Fetch Pages Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load pages." },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const body = await req.json()
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled"
    const projectId = body.projectId ? String(body.projectId) : null
    const icon = body.icon ? String(body.icon) : null

    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: ctx.workspaceId },
      select: { id: true },
    })
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    const page = await prisma.page.create({
      data: {
        title,
        workspaceId: ctx.workspaceId,
        projectId,
        icon,
        createdById: ctx.session.user.id,
      },
      select: pageSelect,
    })

    await logActivity({
      type: "PAGE_CREATED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId,
      description: `created page ${page.title}`,
      metadata: { target: page.title },
    })

    return NextResponse.json({ success: true, page: formatPage(page) }, { status: 201 })
  } catch (error) {
    console.error("Create Page Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create page." },
      { status: 500 }
    )
  }
}
