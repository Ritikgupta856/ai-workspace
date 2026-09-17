import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

/**
 * Tasks live inside their project now. Deep links from favorites,
 * notifications and the home page still use `/tasks?task=<id>`, so resolve
 * the task's project and forward there; everything else goes to My work.
 */
export default async function TasksRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>
}) {
  const { task: taskId } = await searchParams
  if (!taskId) redirect("/my-work")

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspace: { members: { some: { userId: session.user.id } } } },
    select: { projectId: true },
  })

  if (task?.projectId) redirect(`/projects/${task.projectId}/tasks?task=${taskId}`)
  // Project-less tasks only surface in My work.
  redirect(`/my-work?task=${taskId}`)
}
