import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/cloudinary"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { processDocumentBackground } from "@/lib/services/processing"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    })

    if (!membership) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name, file.type)

    // Create document in database starting as PENDING
    const document = await prisma.document.create({
      data: {
        workspaceId: membership.workspaceId,
        title: file.name,
        content: "", // placeholder content
        contentType: "DOC",
        sourceUrl: result.url,
        processingStatus: "PENDING",
        metadata: {
          publicId: result.publicId,
        },
      },
    })

    // Start background processing - fire-and-forget
    void processDocumentBackground(document.id, file.type, file.name, buffer)

    return NextResponse.json({
      id: document.id,
      url: result.url,
      publicId: result.publicId,
      filename: file.name,
      mediaType: file.type,
      bytes: result.bytes,
      processingStatus: document.processingStatus,
    })
  } catch (error: any) {
    console.error("Upload route error:", error)
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 })
  }
}
