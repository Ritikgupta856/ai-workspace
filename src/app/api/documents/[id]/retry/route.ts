import { headers } from "next/headers"
import { after, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { processStoredDocument } from "@/lib/knowledge/rag"
import { prisma } from "@/lib/prisma"

/** Re-runs indexing for a document that failed, e.g. after a provider outage. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const document = await prisma.document.findUnique({
    where: { id },
    select: { workspaceId: true, processingStatus: true },
  })

  const membership = document
    ? await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id, workspaceId: document.workspaceId },
        select: { id: true },
      })
    : null
  if (!document || !membership) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (document.processingStatus !== "FAILED") {
    return NextResponse.json({ error: "Only failed documents can be retried" }, { status: 409 })
  }

  await prisma.document.update({
    where: { id },
    data: { processingStatus: "PENDING", processingError: null },
  })
  after(() => processStoredDocument(id))

  return NextResponse.json({ id, status: "PENDING" })
}
