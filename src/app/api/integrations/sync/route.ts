import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { integrationId } = await req.json()

  if (!integrationId) {
    return NextResponse.json({ error: "Missing integrationId" }, { status: 400 })
  }

  return NextResponse.json({ status: "synced" })
}
