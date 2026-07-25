"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function disconnectIntegration(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
  })
  if (!membership) return

  const integration = await prisma.integration.findFirst({
    where: { id, workspaceId: membership.workspaceId },
  })
  if (!integration) return

  await prisma.integration.delete({ where: { id: integration.id } })

  revalidatePath("/integrations")
  revalidatePath("/home")
}
