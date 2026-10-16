import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dodo } from "@/lib/dodo"
import { findActiveMembership } from "@/lib/api/guards"
import { WORKSPACE_PARAM } from "@/lib/workspace-header"

/** A full-page navigation, so the workspace comes as `?workspace=<slug>`, not a header. */
export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", appUrl))
  }

  const membership = await findActiveMembership(
    session.user.id,
    new URL(req.url).searchParams.get(WORKSPACE_PARAM)
  )

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.redirect(new URL("/agent?billing=error", appUrl))
  }

  const home = `${appUrl}/${membership.workspace.slug}/agent`

  const subscription = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId: membership.workspaceId },
  })

  if (!subscription) {
    return NextResponse.redirect(`${home}?billing=error`)
  }

  try {
    const portalSession = await dodo.customers.customerPortal.create(
      subscription.dodoCustomerId,
      { return_url: home }
    )

    return NextResponse.redirect(portalSession.link)
  } catch (error) {
    console.error("Create Customer Portal Session Error:", error)
    return NextResponse.redirect(`${home}?billing=error`)
  }
}
