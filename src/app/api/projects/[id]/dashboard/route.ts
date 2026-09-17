import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { buildProjectDashboard } from "@/lib/project-dashboard"

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

    const { id: projectId } = await params
    const response = await buildProjectDashboard(projectId, membership.workspaceId)

    if (!response) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, ...response })
  } catch (error) {
    console.error("Dashboard Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
