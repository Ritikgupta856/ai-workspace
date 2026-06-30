import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        workspaceId: true,
        processingStatus: true,
        processingError: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Verify workspace membership
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: document.workspaceId,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Unauthorized access to document" }, { status: 403 })
    }

    return NextResponse.json({
      id: document.id,
      status: document.processingStatus,
      error: document.processingError,
    })
  } catch (error: any) {
    console.error("Document status fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch document status" }, { status: 500 })
  }
}
