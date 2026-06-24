import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { workflowId, inputs } = await req.json()

  if (!workflowId) {
    return NextResponse.json({ error: "Missing workflowId" }, { status: 400 })
  }

  return NextResponse.json({ status: "started", runId: crypto.randomUUID() })
}
