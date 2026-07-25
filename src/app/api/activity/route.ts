import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { activityInclude, formatActivity } from "@/lib/activity"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/**
 * One activity endpoint for every feed. Scope it with query params:
 *
 *   /api/activity                       workspace feed (home)
 *   /api/activity?projectId=…           project feed
 *   /api/activity?taskId=…              task timeline
 *   /api/activity?userId=…&type=…       filtered
 *
 * Cursor pagination throughout, so the same fetcher powers a 6-item card and
 * an infinite list.
 */
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const taskId = url.searchParams.get("taskId")
    const userId = url.searchParams.get("userId")
    const type = url.searchParams.get("type")
    const cursor = url.searchParams.get("cursor")
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )

    // Verify the project belongs to this workspace before scoping to it,
    // otherwise a guessed id would leak another workspace's feed.
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId: membership.workspaceId },
        select: { id: true },
      })
      if (!project) {
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        )
      }
    }

    const activities = await prisma.activity.findMany({
      where: {
        // Always workspace-scoped, whatever else is filtered.
        workspaceId: membership.workspaceId,
        ...(projectId ? { projectId } : {}),
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
        // Activity has no taskId column; task events carry it in metadata.
        ...(taskId
          ? { metadata: { path: ["taskId"], equals: taskId } }
          : {}),
      },
      include: activityInclude,
      orderBy: { createdAt: "desc" },
      // Over-fetch by one to detect whether another page exists.
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = activities.length > limit
    const page = hasMore ? activities.slice(0, limit) : activities

    return NextResponse.json({
      success: true,
      activities: page.map(formatActivity),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    })
  } catch (error) {
    console.error("Activity Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load activity." },
      { status: 500 }
    )
  }
}
