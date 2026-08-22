import type { Metadata } from "next"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/dashboard/page-header"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, workspace and preferences.",
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

  // Same resolution the dashboard layout uses: prefer the cookie, fall back to
  // any membership.
  const membership =
    (activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id, workspaceId: activeWorkspaceId },
        include: { workspace: true },
      })
      : null) ??
    (await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    }))

  if (!membership) redirect("/home")

  const [user, memberCount, projectCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, createdAt: true },
    }),
    prisma.workspaceMember.count({
      where: { workspaceId: membership.workspaceId },
    }),
    prisma.project.count({ where: { workspaceId: membership.workspaceId } }),
  ])

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Settings" />

      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        <SettingsView
          profile={{
            name: user.name ?? "",
            email: user.email,
            image: user.image,
            createdAt: user.createdAt.toISOString(),
          }}
          workspace={{
            id: membership.workspace.id,
            name: membership.workspace.name,
            slug: membership.workspace.slug,
            description: membership.workspace.description,
            memberCount,
            projectCount,
          }}
          role={membership.role}
        />
      </div>
    </div>
  )
}
