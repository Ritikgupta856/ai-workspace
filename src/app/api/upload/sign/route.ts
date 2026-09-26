import { NextResponse } from "next/server"
import { z } from "zod"

import { requireWorkspace } from "@/lib/api/guards"
import { signUpload } from "@/lib/files"
import { fileExtension, uploadProblem } from "@/lib/uploads"

const bodySchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  purpose: z.enum(["document", "attachment"]),
})

/**
 * Step 1 of an upload: a signature that lets the browser write exactly one
 * private file into the active workspace's folder. The file itself goes
 * straight to Cloudinary, so Vercel's 4.5 MB request limit never applies.
 */
export async function POST(req: Request) {
  const ctx = await requireWorkspace()
  if (ctx.error) return ctx.error

  const body = bodySchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 })
  }

  const { filename, size, purpose } = body.data
  const problem = uploadProblem({ name: filename, size }, purpose)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  return NextResponse.json(signUpload(ctx.workspaceId, purpose, fileExtension(filename)))
}
