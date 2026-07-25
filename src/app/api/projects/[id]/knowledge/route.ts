import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireProject } from "@/lib/api/guards"

/**
 * KnowledgeChunk has no projectId — it points at its origin through
 * (sourceType, sourceId). So a project's knowledge is derived: find the
 * project's documents, then the chunks produced from them.
 *
 * `embedding` is an Unsupported("vector(768)") column, so every query here uses
 * an explicit select that leaves it out.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await requireProject(id)
    if (ctx.error) return ctx.error

    const search = new URL(req.url).searchParams.get("q")?.trim()

    const documents = await prisma.document.findMany({
      where: { projectId: id },
      select: {
        id: true,
        title: true,
        contentType: true,
        processingStatus: true,
      },
    })

    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        chunks: [],
        sources: [],
        totalChunks: 0,
        indexedDocuments: 0,
        pendingDocuments: 0,
      })
    }

    const documentIds = documents.map((d) => d.id)
    const byId = new Map(documents.map((d) => [d.id, d]))

    const [chunks, totalChunks] = await Promise.all([
      prisma.knowledgeChunk.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          sourceType: "DOCUMENT",
          sourceId: { in: documentIds },
          ...(search
            ? { content: { contains: search, mode: "insensitive" as const } }
            : {}),
        },
        select: {
          id: true,
          title: true,
          content: true,
          chunkIndex: true,
          sourceId: true,
          sourceType: true,
          createdAt: true,
        },
        orderBy: [{ sourceId: "asc" }, { chunkIndex: "asc" }],
        take: 100,
      }),
      prisma.knowledgeChunk.count({
        where: {
          workspaceId: ctx.workspaceId,
          sourceType: "DOCUMENT",
          sourceId: { in: documentIds },
        },
      }),
    ])

    // How many of the project's documents actually made it into the index.
    const indexedIds = new Set(chunks.map((c) => c.sourceId))

    return NextResponse.json({
      success: true,
      chunks: chunks.map((c) => ({
        id: c.id,
        title: c.title ?? byId.get(c.sourceId)?.title ?? "Untitled",
        // Enough to recognise the passage without shipping whole documents.
        excerpt: c.content.slice(0, 320),
        chunkIndex: c.chunkIndex,
        sourceId: c.sourceId,
        sourceTitle: byId.get(c.sourceId)?.title ?? "Unknown source",
        createdAt: c.createdAt.toISOString(),
      })),
      sources: documents.map((d) => ({
        id: d.id,
        title: d.title,
        contentType: d.contentType,
        processingStatus: d.processingStatus,
        indexed: indexedIds.has(d.id),
      })),
      totalChunks,
      indexedDocuments: documents.filter(
        (d) => d.processingStatus === "COMPLETED"
      ).length,
      pendingDocuments: documents.filter((d) =>
        ["PENDING", "PROCESSING"].includes(d.processingStatus)
      ).length,
    })
  } catch (error) {
    console.error("Project Knowledge Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load knowledge." },
      { status: 500 }
    )
  }
}
