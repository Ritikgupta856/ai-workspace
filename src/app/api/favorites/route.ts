import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"
import type { FavoriteEntityType } from "@/generated/prisma/client"

const ENTITY_TYPES: FavoriteEntityType[] = ["PROJECT", "TASK", "NOTE", "WHITEBOARD", "PAGE"]

function isEntityType(value: unknown): value is FavoriteEntityType {
  return typeof value === "string" && ENTITY_TYPES.includes(value as FavoriteEntityType)
}

/** Favorites have no FK to their target, so names/hrefs are resolved here per type. */
async function resolveEntities(
  workspaceId: string,
  favorites: { entityType: FavoriteEntityType; entityId: string }[]
) {
  const idsByType = new Map<FavoriteEntityType, string[]>()
  for (const f of favorites) {
    idsByType.set(f.entityType, [...(idsByType.get(f.entityType) ?? []), f.entityId])
  }

  const [projects, tasks, notes, whiteboards, pages] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId, id: { in: idsByType.get("PROJECT") ?? [] } },
      select: { id: true, name: true, icon: true },
    }),
    prisma.task.findMany({
      where: { workspaceId, id: { in: idsByType.get("TASK") ?? [] } },
      select: { id: true, title: true },
    }),
    prisma.note.findMany({
      where: { workspaceId, id: { in: idsByType.get("NOTE") ?? [] } },
      select: { id: true, title: true },
    }),
    prisma.whiteboard.findMany({
      where: { workspaceId, id: { in: idsByType.get("WHITEBOARD") ?? [] } },
      select: { id: true, title: true },
    }),
    prisma.page.findMany({
      where: { workspaceId, id: { in: idsByType.get("PAGE") ?? [] } },
      select: { id: true, title: true, icon: true },
    }),
  ])

  const map = new Map<string, { name: string; href: string; icon: string | null }>()
  for (const p of projects) map.set(`PROJECT:${p.id}`, { name: p.name, href: `/projects/${p.id}`, icon: p.icon })
  for (const t of tasks) map.set(`TASK:${t.id}`, { name: t.title, href: `/tasks/${t.id}`, icon: null })
  for (const n of notes) map.set(`NOTE:${n.id}`, { name: n.title, href: `/pages/${n.id}`, icon: null })
  for (const w of whiteboards) map.set(`WHITEBOARD:${w.id}`, { name: w.title, href: `/boards/${w.id}`, icon: null })
  for (const pg of pages) map.set(`PAGE:${pg.id}`, { name: pg.title, href: `/pages/${pg.id}`, icon: pg.icon })

  return map
}

export async function GET(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    // Single-entity check, e.g. for a favorite-toggle button.
    if (entityType && entityId) {
      if (!isEntityType(entityType)) {
        return NextResponse.json(
          { success: false, error: "Invalid entityType" },
          { status: 400 }
        )
      }
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_entityType_entityId: {
            userId: ctx.session.user.id,
            entityType,
            entityId,
          },
        },
      })
      return NextResponse.json({ success: true, favorited: favorite !== null })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    })

    const resolved = await resolveEntities(ctx.workspaceId, favorites)

    const items = favorites
      .map((f) => {
        const entity = resolved.get(`${f.entityType}:${f.entityId}`)
        if (!entity) return null
        return {
          id: f.id,
          entityType: f.entityType,
          entityId: f.entityId,
          name: entity.name,
          href: entity.href,
          icon: entity.icon,
          createdAt: f.createdAt.toISOString(),
        }
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)

    return NextResponse.json({ success: true, favorites: items })
  } catch (error) {
    console.error("Fetch Favorites Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load favorites." },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const body = await req.json()
    const entityType = body.entityType
    const entityId = String(body.entityId ?? "")

    if (!isEntityType(entityType) || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required" },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_entityType_entityId: {
          userId: ctx.session.user.id,
          entityType,
          entityId,
        },
      },
      create: { userId: ctx.session.user.id, entityType, entityId },
      update: {},
    })

    return NextResponse.json({ success: true, favorite }, { status: 201 })
  } catch (error) {
    console.error("Create Favorite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add favorite." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await requireWorkspace()
    if (ctx.error) return ctx.error

    const body = await req.json()
    const entityType = body.entityType
    const entityId = String(body.entityId ?? "")

    if (!isEntityType(entityType) || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required" },
        { status: 400 }
      )
    }

    await prisma.favorite.deleteMany({
      where: { userId: ctx.session.user.id, entityType, entityId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Favorite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove favorite." },
      { status: 500 }
    )
  }
}
