import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function ownedChat(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const chat = await prisma.chat.findFirst({
    where: { id, createdById: session.user.id },
    select: { id: true, title: true },
  })
  return chat
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const chat = await ownedChat(id)
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      attachments: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ chat, messages })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const chat = await ownedChat(id)
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { title } = (await req.json().catch(() => ({}))) as { title?: string }
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 })
  }

  const updated = await prisma.chat.update({
    where: { id },
    data: { title: title.trim().slice(0, 120) },
    select: { id: true, title: true, updatedAt: true },
  })

  return NextResponse.json({ chat: updated })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const chat = await ownedChat(id)
  if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.chat.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
