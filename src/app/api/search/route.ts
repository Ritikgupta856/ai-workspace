import { NextResponse } from "next/server"

import { requireWorkspace } from "@/lib/api/guards"
import { searchWorkspace } from "@/lib/search"

const MAX_QUERY_LENGTH = 100

export async function GET(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH)

    if (!query) return NextResponse.json({ success: true, results: [] })

    const results = await searchWorkspace(ctx.workspaceId, ctx.session.user.id, query)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Search Error:", error)
    return NextResponse.json(
      { success: false, error: "Search failed." },
      { status: 500 }
    )
  }
}
