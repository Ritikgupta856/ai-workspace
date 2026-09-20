import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

/**
 * Resolves which workspace a bare, slug-less URL (`/agent`, `/projects`, ...)
 * should redirect into: the `activeWorkspaceId` cookie if it still points at
 * a real membership, else the user's oldest membership, else a brand-new
 * personal workspace. Used only by the top-level redirect shims — pages
 * under `/[slug]/...` resolve the workspace from the URL itself instead.
 */
export async function resolveDefaultWorkspaceSlug(userId: string, userName?: string | null): Promise<string> {
  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true, workspace: { select: { slug: true } } },
  })

  const active = memberships.find((m) => m.workspaceId === activeWorkspaceId) ?? memberships[0]
  if (active) return active.workspace.slug

  const workspace = await prisma.workspace.create({
    data: {
      name: `${userName?.split(" ")[0] ?? "Personal"}'s workspace`,
      slug: `${(userName?.split(" ")[0] ?? "personal").toLowerCase()}-${userId.slice(0, 8)}`,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { slug: true },
  })
  return workspace.slug
}

/**
 * Shared body for the top-level legacy shims (`/agent`, `/projects`, ...):
 * resolve the user's workspace, preserve the query string, redirect into
 * the slug-prefixed equivalent. `path` has no leading slash, e.g. "agent".
 */
export async function redirectIntoWorkspace(
  userId: string,
  userName: string | null | undefined,
  path: string,
  rawSearchParams: Record<string, string | string[] | undefined>
): Promise<never> {
  const slug = await resolveDefaultWorkspaceSlug(userId, userName)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else if (value !== undefined) params.set(key, value)
  }
  const query = params.toString()
  redirect(`/${slug}/${path}${query ? `?${query}` : ""}`)
}
