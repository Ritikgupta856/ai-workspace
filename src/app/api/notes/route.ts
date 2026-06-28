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

    const notes = await prisma.note.findMany({
      where: { workspaceId: membership.workspaceId },
      include: {
        author: { select: { name: true } },
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    })

    const formatted = notes.map((note) => ({
      id: note.id,
      title: note.title,
      preview: note.content.slice(0, 200),
      content: note.content,
      tags: note.tags,
      author: note.author.name ?? "Unknown",
      pinned: note.pinned,
      updatedAt: note.updatedAt.toISOString(),
    }))

    return NextResponse.json({ success: true, notes: formatted })
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
    const { title, tags } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        tags: tags ?? [],
        workspaceId: membership.workspaceId,
        authorId: session.user.id,
      },
      include: {
        author: { select: { name: true } },
      },
    })

    const formatted = {
      id: note.id,
      title: note.title,
      preview: "",
      content: "",
      tags: note.tags,
      author: note.author.name ?? "Unknown",
      pinned: note.pinned,
      updatedAt: note.updatedAt.toISOString(),
    }

    return NextResponse.json(
      { success: true, message: "Note created successfully.", note: formatted },
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
