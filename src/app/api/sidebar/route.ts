import { NextResponse } from "next/server"

import { requireWorkspace } from "@/lib/api/guards"
import { getSidebarData } from "@/lib/sidebar-data"

/** Client-side revalidation for the sidebar after a mutation; first paint comes from the layout. */
export async function GET() {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error
    const data = await getSidebarData(ctx.session.user.id, ctx.workspaceId)
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error("Sidebar Error:", error)
    return NextResponse.json({ success: false, error: "Failed to load sidebar." }, { status: 500 })
  }
}
