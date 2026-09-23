import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Resolves which workspace the slug-less home page (`/`) sends a signed-in
 * user into: the `activeWorkspaceId` cookie if it still points at a real
 * membership, else the user's oldest membership, else a brand-new personal
 * workspace. Pages under `/[slug]/...` resolve the workspace from the URL.
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
