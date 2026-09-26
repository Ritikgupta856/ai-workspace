import { after, NextResponse } from "next/server"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import { requireWorkspace } from "@/lib/api/guards"
import { deleteFile, fileUrl, folderOf, inspectFile, workspaceOfFile } from "@/lib/files"
import { isSupportedDocument, processStoredDocument } from "@/lib/knowledge/rag"
import { prisma } from "@/lib/prisma"
import { fileExtension, uploadProblem, type UploadedFile } from "@/lib/uploads"

const bodySchema = z.object({
  publicId: z.string().min(1),
  filename: z.string().min(1).max(255),
  mediaType: z.string().max(255),
  purpose: z.enum(["document", "attachment"]),
})

/**
 * Step 2 of an upload, after the browser has sent the file to Cloudinary.
 * Nothing the browser says is trusted: the file must sit in this workspace's
 * folder, and its real size comes from Cloudinary. Readable documents are then
 * indexed into the knowledge base in the background.
 */
export async function POST(req: Request) {
  const ctx = await requireWorkspace()
  if (ctx.error) return ctx.error

  const body = bodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 })
  }

  const { publicId, filename, mediaType, purpose } = body.data

  if (
    workspaceOfFile(publicId) !== ctx.workspaceId ||
    folderOf(publicId) !== purpose ||
    fileExtension(publicId) !== fileExtension(filename)
  ) {
    return NextResponse.json({ error: "This upload doesn't belong to your workspace" }, { status: 403 })
  }

  const stored = await inspectFile(publicId)
  if (!stored) {
    return NextResponse.json({ error: "Upload not found in storage" }, { status: 400 })
  }

  const problem = uploadProblem({ name: filename, size: stored.bytes }, purpose)
  if (problem) {
    await deleteFile(publicId)
    return NextResponse.json({ error: problem }, { status: 400 })
  }

  const url = fileUrl(publicId)
  const result: UploadedFile = { url, filename, mediaType, bytes: stored.bytes }

  if (purpose === "document" && isSupportedDocument(mediaType, filename)) {
    // A retried request must not index the same file twice.
    const existing = await prisma.document.findFirst({
      where: { workspaceId: ctx.workspaceId, sourceUrl: url },
      select: { id: true },
    })

    if (existing) {
      result.documentId = existing.id
    } else {
      const document = await prisma.document.create({
        data: {
          workspaceId: ctx.workspaceId,
          title: filename,
          content: "",
          contentType: "DOC",
          sourceUrl: url,
          processingStatus: "PENDING",
          metadata: { publicId, mediaType, bytes: stored.bytes },
        },
        select: { id: true, title: true },
      })
      result.documentId = document.id

      await logActivity({
        type: "DOCUMENT_UPLOADED",
        workspaceId: ctx.workspaceId,
        userId: ctx.session.user.id,
        metadata: { target: document.title },
      })

      // Runs after the response; `after` keeps a Vercel function alive until it
      // finishes, where a bare un-awaited promise can be frozen mid-way.
      after(() => processStoredDocument(document.id))
    }
  }

  return NextResponse.json(result)
}
