import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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

    const note = await prisma.note.findFirst({
      where: { id, workspaceId: membership.workspaceId },
      include: {
        author: { select: { name: true } },
      },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      )
    }

    const formatted = {
      id: note.id,
      title: note.title,
      preview: note.content.slice(0, 200),
      content: note.content,
      tags: note.tags,
      author: note.author.name ?? "Unknown",
      pinned: note.pinned,
      updatedAt: note.updatedAt.toISOString(),
    }

    return NextResponse.json({ success: true, note: formatted })
  } catch (error) {
    console.error("Fetch Note Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch note." },
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

    const existing = await prisma.note.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, content, tags, pinned } = body

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
        ...(pinned !== undefined && { pinned }),
      },
      include: {
        author: { select: { name: true } },
      },
    })

    const formatted = {
      id: note.id,
      title: note.title,
      preview: note.content.slice(0, 200),
      content: note.content,
      tags: note.tags,
      author: note.author.name ?? "Unknown",
      pinned: note.pinned,
      updatedAt: note.updatedAt.toISOString(),
    }

    return NextResponse.json({ success: true, note: formatted })
  } catch (error) {
    console.error("Update Note Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update note." },
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

    const existing = await prisma.note.findFirst({
      where: { id, workspaceId: membership.workspaceId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      )
    }

    await prisma.note.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Note deleted." })
  } catch (error) {
    console.error("Delete Note Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete note." },
      { status: 500 }
    )
  }
}
