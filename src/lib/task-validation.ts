import { TaskPriority, TaskStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

type TaskWriteFields = {
  status?: unknown
  priority?: unknown
  projectId?: unknown
  assigneeId?: unknown
  parentTaskId?: unknown
}

const isOneOf = (values: Record<string, string>, value: unknown) =>
  typeof value === "string" && Object.values(values).includes(value)

/**
 * Checks what a task create or update names. The UI only offers valid choices,
 * but a crafted request can send any id, and the database would happily point
 * a task at another workspace's project, a non-member, or another workspace's
 * task. Fields that are absent or null (cleared) aren't checked. `taskId` is
 * the task being edited, so a parent change can't create a loop.
 *
 * Returns a message for a 400 response, or null when the write is valid.
 */
export async function taskWriteProblem(
  workspaceId: string,
  fields: TaskWriteFields,
  taskId?: string
): Promise<string | null> {
  const { status, priority, projectId, assigneeId, parentTaskId } = fields

  if (status != null && !isOneOf(TaskStatus, status)) return "Invalid task status."
  if (priority != null && !isOneOf(TaskPriority, priority)) return "Invalid task priority."

  if (projectId != null) {
    const project =
      typeof projectId === "string"
        ? await prisma.project.findFirst({ where: { id: projectId, workspaceId }, select: { id: true } })
        : null
    if (!project) return "That project isn't in this workspace."
  }

  if (assigneeId != null) {
    const member =
      typeof assigneeId === "string"
        ? await prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
            select: { id: true },
          })
        : null
    if (!member) return "That person isn't a member of this workspace."
  }

  if (parentTaskId != null) {
    if (parentTaskId === taskId) return "A task can't be its own parent."

    const parent =
      typeof parentTaskId === "string"
        ? await prisma.task.findFirst({ where: { id: parentTaskId, workspaceId }, select: { parentTaskId: true } })
        : null
    if (!parent) return "That parent task isn't in this workspace."

    // Walk up from the new parent; meeting the edited task on the way means it
    // would end up under its own subtask. `seen` stops on a loop already stored.
    if (taskId) {
      const seen = new Set<string>([parentTaskId as string])
      let next = parent.parentTaskId
      while (next && !seen.has(next)) {
        if (next === taskId) return "A task can't be moved under one of its own subtasks."
        seen.add(next)
        const row = await prisma.task.findUnique({ where: { id: next }, select: { parentTaskId: true } })
        next = row?.parentTaskId ?? null
      }
    }
  }

  return null
}
