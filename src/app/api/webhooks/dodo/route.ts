import { Webhooks } from "@dodopayments/nextjs"
import type DodoPayments from "dodopayments"

import { prisma } from "@/lib/prisma"
import type { SubscriptionStatus } from "@/generated/prisma/enums"

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  pending: "PENDING",
  active: "ACTIVE",
  on_hold: "ON_HOLD",
  paused: "PAUSED",
  cancelled: "CANCELLED",
  failed: "FAILED",
  expired: "EXPIRED",
  past_due: "PAST_DUE",
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (rawPayload) => {
    // @dodopayments/nextjs infers a looser zod union here that doesn't narrow
    // cleanly on `payload_type`. The wire format matches the SDK's own
    // WebhookPayload type, so use that for the discriminated union.
    const payload = rawPayload as unknown as DodoPayments.WebhookPayload

    // Subscription events carry the full subscription snapshot — this is the
    // single source of truth for status, billing period and cancellation.
    if (payload.data.payload_type === "Subscription") {
      const sub = payload.data
      const workspaceId = sub.metadata?.workspaceId
      if (typeof workspaceId !== "string" || !workspaceId) return

      const status = STATUS_MAP[sub.status] ?? "ACTIVE"

      await prisma.workspaceSubscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          dodoCustomerId: sub.customer.customer_id,
          dodoSubscriptionId: sub.subscription_id,
          productId: sub.product_id,
          status,
          currentPeriodStart: new Date(sub.previous_billing_date),
          currentPeriodEnd: new Date(sub.next_billing_date),
          cancelAtNextBillingDate: sub.cancel_at_next_billing_date,
          cancelledAt: sub.cancelled_at ? new Date(sub.cancelled_at) : null,
        },
        update: {
          dodoCustomerId: sub.customer.customer_id,
          dodoSubscriptionId: sub.subscription_id,
          productId: sub.product_id,
          status,
          currentPeriodStart: new Date(sub.previous_billing_date),
          currentPeriodEnd: new Date(sub.next_billing_date),
          cancelAtNextBillingDate: sub.cancel_at_next_billing_date,
          cancelledAt: sub.cancelled_at ? new Date(sub.cancelled_at) : null,
        },
      })
      return
    }

    // A failed recurring payment doesn't change the subscription row itself —
    // Dodo follows up with a `subscription.on_hold` event once retries are
    // exhausted, which the branch above already handles. We just make sure a
    // one-off failure surfaces immediately rather than waiting for that.
    if (payload.data.payload_type === "Payment" && payload.type === "payment.failed") {
      const workspaceId = payload.data.metadata?.workspaceId
      if (typeof workspaceId !== "string" || !workspaceId) return

      await prisma.workspaceSubscription.updateMany({
        where: { workspaceId, status: "ACTIVE" },
        data: { status: "PAST_DUE" },
      })
    }
  },
})
