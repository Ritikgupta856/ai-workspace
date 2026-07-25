import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { formatNote, noteInclude } from "@/lib/notes"
import { logActivity } from "@/lib/activity"

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
      include: noteInclude,
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, note: formatNote(note) })
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
      include: noteInclude,
    })

    return NextResponse.json({ success: true, note: formatNote(note) })
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

    await logActivity({
      type: "NOTE_DELETED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      metadata: { target: existing.title },
    })

    return NextResponse.json({ success: true, message: "Note deleted." })
  } catch (error) {
    console.error("Delete Note Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete note." },
      { status: 500 }
    )
  }
}
