import { prisma } from "@/lib/prisma"
import { TASK_STATUS_CONFIG } from "@/lib/constants"

/* ── Types shared by /api/search and the ⌘K dialog ── */

export type SearchResultType = "task" | "project" | "page" | "board" | "chat" | "member"

export type SearchResult = {
  type: SearchResultType
  id: string
  title: string
  subtitle: string | null
  /** Workspace-relative path ("/projects/…") or a query string ("?settings=…"); the client adds the slug. */
  href: string
  /** Emoji the user picked for a project or page, if any. */
  emoji: string | null
}

const PER_TYPE = 5

/**
 * Title-only match across everything a member can open in the workspace.
 * Destinations mirror listFavorites so a result opens where a favorite would.
 */
export async function searchWorkspace(
  workspaceId: string,
  userId: string,
  query: string
): Promise<SearchResult[]> {
  const match = { contains: query, mode: "insensitive" as const }
  const recent = { updatedAt: "desc" as const }

  const [tasks, projects, pages, boards, chats, members] = await Promise.all([
    prisma.task.findMany({
      where: { workspaceId, title: match },
      orderBy: recent,
      take: PER_TYPE,
      select: { id: true, title: true, status: true, projectId: true, project: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { workspaceId, name: match },
      orderBy: recent,
      take: PER_TYPE,
      select: { id: true, name: true, description: true, icon: true },
    }),
    prisma.page.findMany({
      where: { workspaceId, title: match },
      orderBy: recent,
      take: PER_TYPE,
      select: { id: true, title: true, icon: true, projectId: true, project: { select: { name: true } } },
    }),
    // Boards only open inside a project, so project-less ones are left out.
    prisma.whiteboard.findMany({
      where: { workspaceId, title: match, projectId: { not: null } },
      orderBy: recent,
      take: PER_TYPE,
      select: { id: true, title: true, projectId: true, project: { select: { name: true } } },
    }),
    // Agent chats are private to the person who started them.
    prisma.chat.findMany({
      where: { workspaceId, createdById: userId, title: match },
      orderBy: recent,
      take: PER_TYPE,
      select: { id: true, title: true },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId, user: { OR: [{ name: match }, { email: match }] } },
      orderBy: { createdAt: "asc" },
      take: PER_TYPE,
      select: { user: { select: { id: true, name: true, email: true } } },
    }),
  ])

  return [
    ...tasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      subtitle: [t.project?.name, TASK_STATUS_CONFIG[t.status].label].filter(Boolean).join(" · "),
      // Project-less tasks only surface in My work.
      href: t.projectId ? `/projects/${t.projectId}/tasks?task=${t.id}` : `/my-work?task=${t.id}`,
      emoji: null,
    })),
    ...projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: p.description,
      href: `/projects/${p.id}`,
      emoji: p.icon,
    })),
    ...pages.map((pg) => ({
      type: "page" as const,
      id: pg.id,
      title: pg.title,
      subtitle: pg.project?.name ?? "Workspace page",
      href: pg.projectId ? `/projects/${pg.projectId}/pages/${pg.id}` : `/pages/${pg.id}`,
      emoji: pg.icon,
    })),
    ...boards.map((w) => ({
      type: "board" as const,
      id: w.id,
      title: w.title,
      subtitle: w.project?.name ?? null,
      href: `/projects/${w.projectId}/board/${w.id}`,
      emoji: null,
    })),
    ...chats.map((c) => ({
      type: "chat" as const,
      id: c.id,
      title: c.title ?? "Untitled chat",
      subtitle: "Agent conversation",
      href: `/agent?chat=${c.id}`,
      emoji: null,
    })),
    ...members.map(({ user }) => ({
      type: "member" as const,
      id: user.id,
      title: user.name ?? user.email,
      subtitle: user.email,
      href: "?settings=members",
      emoji: null,
    })),
  ]
}
