import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"
import { logActivity } from "@/lib/activity"
import type { Prisma } from "@/generated/prisma/client"

const pageSelect = {
  id: true,
  workspaceId: true,
  projectId: true,
  title: true,
  content: true,
  icon: true,
  coverImage: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true, image: true } },
  project: { select: { id: true, name: true } },
} as const

type PageRow = {
  id: string
  workspaceId: string
  projectId: string
  title: string
  content: unknown
  icon: string | null
  coverImage: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string | null; email: string; image: string | null }
  project: { id: string; name: string }
}

function formatPage(page: PageRow) {
  return {
    id: page.id,
    workspaceId: page.workspaceId,
    projectId: page.projectId,
    project: page.project,
    title: page.title,
    content: page.content,
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { id } = await params

    const page = await prisma.page.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
      select: pageSelect,
    })

    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, page: formatPage(page) })
  } catch (error) {
    console.error("Fetch Page Error:", error)
    return NextResponse.json({ success: false, error: "Failed to load page." }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { id } = await params

    const existing = await prisma.page.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 })
    }

    const body = await req.json()
    const data: Prisma.PageUpdateInput = {}

    if (body.title !== undefined) {
      const title = String(body.title).trim()
      data.title = title || "Untitled"
    }
    if (body.content !== undefined) {
      data.content = body.content as Prisma.InputJsonValue
    }
    if (body.icon !== undefined) {
      data.icon = body.icon ? String(body.icon) : null
    }
    if (body.coverImage !== undefined) {
      data.coverImage = body.coverImage ? String(body.coverImage) : null
    }

    if (body.projectId !== undefined) {
      const projectId = body.projectId ? String(body.projectId) : null
      if (!projectId) {
        return NextResponse.json({ success: false, error: "A page must belong to a project" }, { status: 400 })
      }
      const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId: ctx.workspaceId },
        select: { id: true },
      })
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
      }
      data.project = { connect: { id: projectId } }
    }

    const page = await prisma.page.update({
      where: { id },
      data,
      select: pageSelect,
    })

    return NextResponse.json({ success: true, page: formatPage(page) })
  } catch (error) {
    console.error("Update Page Error:", error)
    return NextResponse.json({ success: false, error: "Failed to update page." }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { id } = await params

    const existing = await prisma.page.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 })
    }

    await prisma.page.delete({ where: { id } })

    await logActivity({
      type: "PAGE_DELETED",
      workspaceId: ctx.workspaceId,
      userId: ctx.session.user.id,
      projectId: existing.projectId,
      description: `deleted page ${existing.title}`,
      metadata: { target: existing.title },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Page Error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete page." }, { status: 500 })
  }
}
