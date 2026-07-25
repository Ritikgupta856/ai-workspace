import { NextResponse } from "next/server"
import { headers } from "next/headers"
import type { Prisma } from "@/generated/prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function accessibleBoard(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })
  if (!membership) return null

  // Scoped by workspace, not by author: a board is a shared artefact, so any
  // member of the workspace can open and edit it.
  const board = await prisma.whiteboard.findFirst({
    where: { id, workspaceId: membership.workspaceId },
    select: { id: true },
  })
  if (!board) return null

  return { userId: session.user.id, workspaceId: membership.workspaceId }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const access = await accessibleBoard(id)
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const board = await prisma.whiteboard.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      scene: true,
      files: true,
      updatedAt: true,
      createdBy: { select: { name: true, image: true } },
    },
  })

  return NextResponse.json({ board })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const access = await accessibleBoard(id)
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as {
    title?: string
    scene?: unknown
    files?: unknown
  }

  const data: Prisma.WhiteboardUpdateInput = {}
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim().slice(0, 120)
  }
  if (body.scene !== undefined) {
    data.scene = body.scene as Prisma.InputJsonValue
  }
  if (body.files !== undefined) {
    data.files = body.files as Prisma.InputJsonValue
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const board = await prisma.whiteboard.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true },
  })

  return NextResponse.json({ board })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const access = await accessibleBoard(id)
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.whiteboard.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
