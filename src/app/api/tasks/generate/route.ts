import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
  }

  return NextResponse.json({ tasks: [] })
}
