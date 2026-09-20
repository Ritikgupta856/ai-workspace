import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/**
 * Tasks live inside their project now. Deep links from favorites and
 * notifications use `/<slug>/tasks?task=<id>`, so resolve the task's project
 * and forward there; everything else goes to My work.
 */
export default async function TasksRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ task?: string }>
}) {
  const { slug } = await params
  const { task: taskId } = await searchParams
  if (!taskId) redirect(`/${slug}/my-work`)

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspace: { members: { some: { userId: session.user.id } } } },
    select: { projectId: true },
  })

  if (task?.projectId) redirect(`/${slug}/projects/${task.projectId}/tasks?task=${taskId}`)
  // Project-less tasks only surface in My work.
  redirect(`/${slug}/my-work?task=${taskId}`)
}
