import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function currentWorkspace() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })
  if (!membership) return null

  return { userId: session.user.id, workspaceId: membership.workspaceId }
}

export async function GET() {
  const ctx = await currentWorkspace()
  if (!ctx) return NextResponse.json({ chats: [] })

  const chats = await prisma.chat.findMany({
    where: { workspaceId: ctx.workspaceId, createdById: ctx.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  })

  return NextResponse.json({ chats })
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title } = (await req.json().catch(() => ({}))) as { title?: string }

  const chat = await prisma.chat.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdById: ctx.userId,
      title: title?.slice(0, 120) || null,
    },
    select: { id: true, title: true, updatedAt: true },
  })

  return NextResponse.json({ chat })
}
