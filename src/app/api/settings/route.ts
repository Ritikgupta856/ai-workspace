import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

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

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    const [user, memberCount, projectCount, subscription] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true, createdAt: true },
      }),
      prisma.workspaceMember.count({
        where: { workspaceId: membership.workspaceId },
      }),
      prisma.project.count({ where: { workspaceId: membership.workspaceId } }),
      prisma.workspaceSubscription.findUnique({
        where: { workspaceId: membership.workspaceId },
      }),
    ])

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name ?? "",
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
      },
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        description: membership.workspace.description,
        memberCount,
        projectCount,
      },
      role: membership.role,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtNextBillingDate: subscription.cancelAtNextBillingDate,
          }
        : null,
    })
  } catch (error) {
    console.error("Get Settings Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    )
  }
}
