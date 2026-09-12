import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dodo, DODO_PRO_PRODUCT_ID } from "@/lib/dodo"

const ACTIVE_STATUSES = ["PENDING", "ACTIVE", "ON_HOLD", "PAUSED", "PAST_DUE"]

export async function POST() {
  try {
    if (!DODO_PRO_PRODUCT_ID) {
      return NextResponse.json(
        { success: false, error: "Billing is not configured" },
        { status: 500 }
      )
    }

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
          })
        : null) ??
      (await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
      }))

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    if (membership.role !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only the workspace owner can manage billing" },
        { status: 403 }
      )
    }

    const existing = await prisma.workspaceSubscription.findUnique({
      where: { workspaceId: membership.workspaceId },
    })

    if (existing && ACTIVE_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "This workspace already has a subscription. Manage it from the billing portal.",
        },
        { status: 409 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: DODO_PRO_PRODUCT_ID, quantity: 1 }],
      customer: existing
        ? { customer_id: existing.dodoCustomerId }
        : { email: session.user.email, name: session.user.name ?? undefined },
      metadata: { workspaceId: membership.workspaceId },
      return_url: `${appUrl}/home?billing=success`,
    })

    return NextResponse.json({ success: true, url: checkoutSession.checkout_url })
  } catch (error) {
    console.error("Create Checkout Session Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to start checkout" },
      { status: 500 }
    )
  }
}
