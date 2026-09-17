import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { requireWorkspace } from "@/lib/api/guards"
import { listFavorites } from "@/lib/sidebar-data"
import type { FavoriteEntityType } from "@/generated/prisma/client"

const ENTITY_TYPES: FavoriteEntityType[] = ["PROJECT", "TASK", "NOTE", "WHITEBOARD", "PAGE"]

function isEntityType(value: unknown): value is FavoriteEntityType {
  return typeof value === "string" && ENTITY_TYPES.includes(value as FavoriteEntityType)
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

    const items = await listFavorites(ctx.session.user.id, ctx.workspaceId)

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
