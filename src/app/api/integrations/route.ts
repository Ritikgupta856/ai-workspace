import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { IntegrationRuntime } from "@/components/integrations/integrations-view"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) {
    return NextResponse.json({ success: false, error: "No workspace found" }, { status: 400 })
  }

  const integrations = await prisma.integration.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
  })

  const runtimes: Record<string, IntegrationRuntime> = {}
  for (const integration of integrations) {
    runtimes[integration.type] = {
      id: integration.id,
      status: integration.status,
      accountName: integration.name,
      lastSyncAt: integration.lastSyncAt ? integration.lastSyncAt.toISOString() : null,
    }
  }

  return NextResponse.json({ success: true, runtimes })
}
