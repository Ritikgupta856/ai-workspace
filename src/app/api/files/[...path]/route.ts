import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { FILE_ROUTE, publicIdFromUrl, signedFileUrl, workspaceOfFile } from "@/lib/files"
import { prisma } from "@/lib/prisma"

/**
 * The permanent address of every uploaded file. Pages, chats and documents
 * store this URL; each open checks the viewer belongs to the file's workspace,
 * then redirects to a Cloudinary link that expires in minutes.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { path } = await params
  const publicId = publicIdFromUrl(FILE_ROUTE + path.join("/"))
  const workspaceId = publicId ? workspaceOfFile(publicId) : null

  // Same 404 for "no such file" and "not your workspace", so ids can't be probed.
  const membership = workspaceId
    ? await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id, workspaceId },
        select: { id: true },
      })
    : null
  if (!publicId || !membership) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const response = NextResponse.redirect(signedFileUrl(publicId), 302)
  // Shorter than the signed link's 10 minutes, so a cached redirect never points at an expired one.
  response.headers.set("Cache-Control", "private, max-age=300")
  return response
}
