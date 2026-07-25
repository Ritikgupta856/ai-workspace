import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { formatNote, noteInclude } from "@/lib/notes"
import { logActivity } from "@/lib/activity"

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

    const notes = await prisma.note.findMany({
      where: { workspaceId: membership.workspaceId },
      include: noteInclude,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    })

    return NextResponse.json({
      success: true,
      notes: notes.map(formatNote),
      // Lets the client resolve "My notes" without guessing at display names.
      currentUserId: session.user.id,
    })
  } catch (error) {
    console.error("Fetch Notes Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes." },
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
    const { title, tags, content } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        // `content` is supplied when duplicating an existing note.
        content: typeof content === "string" ? content : "",
        tags: Array.isArray(tags) ? tags : [],
        workspaceId: membership.workspaceId,
        authorId: session.user.id,
      },
      include: noteInclude,
    })

    await logActivity({
      type: "NOTE_CREATED",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      metadata: { target: note.title },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Note created successfully.",
        note: formatNote(note),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create Note Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create note." },
      { status: 500 }
    )
  }
}
