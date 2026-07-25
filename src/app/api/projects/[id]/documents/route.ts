import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireProject } from "@/lib/api/guards"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const documents = await prisma.document.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        contentType: true,
        sourceUrl: true,
        processingStatus: true,
        processingError: true,
        processedAt: true,
        createdAt: true,
        updatedAt: true,
        integration: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({
      success: true,
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        contentType: d.contentType,
        sourceUrl: d.sourceUrl,
        processingStatus: d.processingStatus,
        processingError: d.processingError,
        processedAt: d.processedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        source: d.integration
          ? { id: d.integration.id, name: d.integration.name, type: d.integration.type }
          : null,
      })),
    })
  } catch (error) {
    console.error("Project Documents Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load documents." },
      { status: 500 }
    )
  }
}

/** Attaches an already-uploaded workspace document to this project. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const { documentId } = await req.json()

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "documentId is required" },
        { status: 400 }
      )
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, workspaceId: ctx.workspaceId },
      select: { id: true },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { projectId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Attach Document Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to attach document." },
      { status: 500 }
    )
  }
}
