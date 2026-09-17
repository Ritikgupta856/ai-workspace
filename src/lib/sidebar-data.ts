import { prisma } from "@/lib/prisma"
import type { FavoriteEntityType } from "@/generated/prisma/client"

/* ── Types shared by the server layout, the /api/sidebar route and AppSidebar ── */

export type SidebarProject = {
  id: string
  name: string
  icon: string | null
  taskCount: number
  pageCount: number
  whiteboardCount: number
}

export type SidebarFavorite = {
  id: string
  entityType: FavoriteEntityType
  entityId: string
  name: string
  href: string
  icon: string | null
}

export type SidebarData = {
  projects: SidebarProject[]
  favorites: SidebarFavorite[]
  unreadCount: number
}

/** Favorites have no FK to their target, so names/hrefs are resolved here per type. */
export async function listFavorites(userId: string, workspaceId: string): Promise<SidebarFavorite[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  if (favorites.length === 0) return []

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
      select: { id: true, title: true, projectId: true },
    }),
    prisma.page.findMany({
      where: { workspaceId, id: { in: idsByType.get("PAGE") ?? [] } },
      select: { id: true, title: true, icon: true },
    }),
  ])

  const map = new Map<string, { name: string; href: string; icon: string | null }>()
  for (const p of projects) map.set(`PROJECT:${p.id}`, { name: p.name, href: `/projects/${p.id}`, icon: p.icon })
  for (const t of tasks) map.set(`TASK:${t.id}`, { name: t.title, href: `/tasks?task=${t.id}`, icon: null })
  for (const n of notes) map.set(`NOTE:${n.id}`, { name: n.title, href: `/pages/${n.id}`, icon: null })
  for (const w of whiteboards)
    map.set(`WHITEBOARD:${w.id}`, {
      name: w.title,
      href: w.projectId ? `/projects/${w.projectId}/board/${w.id}` : `/boards/${w.id}`,
      icon: null,
    })
  for (const pg of pages) map.set(`PAGE:${pg.id}`, { name: pg.title, href: `/pages/${pg.id}`, icon: pg.icon })

  return favorites.flatMap((f) => {
    const entity = map.get(`${f.entityType}:${f.entityId}`)
    if (!entity) return []
    return [{ id: f.id, entityType: f.entityType, entityId: f.entityId, ...entity }]
  })
}

/**
 * Everything the sidebar needs in one round trip. The dashboard layout calls
 * this on the server so the sidebar paints complete on first render; the
 * client only re-requests it (via /api/sidebar) after a mutation.
 */
export async function getSidebarData(userId: string, workspaceId: string): Promise<SidebarData> {
  const [projects, favorites, unreadCount] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        icon: true,
        _count: { select: { tasks: true, pages: true, whiteboards: true } },
      },
    }),
    listFavorites(userId, workspaceId),
    prisma.notification.count({ where: { userId, archived: false, read: false } }),
  ])

  return {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      taskCount: p._count.tasks,
      pageCount: p._count.pages,
      whiteboardCount: p._count.whiteboards,
    })),
    favorites,
    unreadCount,
  }
}
