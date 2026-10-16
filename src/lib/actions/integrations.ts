"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findMembership } from "@/lib/api/guards"

export async function disconnectIntegration(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return

  // A server action can't carry the workspace header, so the integration's own
  // workspace decides, as long as the user is a member of it.
  const integration = await prisma.integration.findUnique({ where: { id } })
  if (!integration) return

  const membership = await findMembership(session.user.id, integration.workspaceId)
  if (!membership) return

  await prisma.integration.delete({ where: { id: integration.id } })

  revalidatePath("/[slug]/agent", "page")
}
