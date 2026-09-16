import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile } from "@/lib/cloudinary"

const MAX_BYTES = 25 * 1024 * 1024

/**
 * Uploads a file for embedding in a Page's editor content (images, attachments).
 * Unlike /api/upload this doesn't create a Document row or trigger knowledge
 * processing — it just returns a URL for the editor to insert.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "File is larger than 25MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile(buffer, file.name, file.type)

    return NextResponse.json({
      success: true,
      url: result.url,
      name: file.name,
      size: result.bytes,
      mediaType: result.mediaType,
    })
  } catch (error) {
    console.error("Page Attachment Upload Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload file." },
      { status: 500 }
    )
  }
}
