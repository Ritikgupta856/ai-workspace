import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { query } = await req.json()

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  return NextResponse.json({ results: [] })
}
