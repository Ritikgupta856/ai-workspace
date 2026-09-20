import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dodo } from "@/lib/dodo"

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", appUrl))
  }

  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

  const membership =
    (activeWorkspaceId
      ? await prisma.workspaceMember.findFirst({
          where: { userId: session.user.id, workspaceId: activeWorkspaceId },
        })
      : null) ??
    (await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    }))

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.redirect(new URL("/agent?billing=error", appUrl))
  }

  const subscription = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId: membership.workspaceId },
  })

  if (!subscription) {
    return NextResponse.redirect(new URL("/agent?billing=error", appUrl))
  }

  try {
    const portalSession = await dodo.customers.customerPortal.create(
      subscription.dodoCustomerId,
      { return_url: `${appUrl}/agent` }
    )

    return NextResponse.redirect(portalSession.link)
  } catch (error) {
    console.error("Create Customer Portal Session Error:", error)
    return NextResponse.redirect(new URL("/agent?billing=error", appUrl))
  }
}
