import { NextResponse } from "next/server"
import { requireProject } from "@/lib/api/guards"
import { buildProjectDashboard } from "@/lib/project-dashboard"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const ctx = await requireProject(projectId)
    if (ctx.error) return ctx.error

    const response = await buildProjectDashboard(projectId, ctx.workspaceId, ctx.session.user.id)

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
