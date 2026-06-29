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

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: true,
      },
    })

    const formatted = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      joinedAt: m.createdAt,
    }))

    return NextResponse.json({
      success: true,
      workspaces: formatted,
    })
  } catch (error) {
    console.error("List Workspaces Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to list workspaces" },
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

    const body = await req.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Verify membership
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("activeWorkspaceId", workspaceId, {
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Switch Workspace Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to switch workspace" },
      { status: 500 }
    )
  }
}
