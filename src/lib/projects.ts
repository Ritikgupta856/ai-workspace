/**
 * Project helpers shared by the API routes.
 *
 * The response shape lives here so the list, detail and dashboard endpoints
 * can't drift apart — that drift is why the list endpoint used to return
 * `members: []` and `integrationCount: 0` while the dashboard returned real
 * values for the same project.
 */

export const PROJECT_STATUSES = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
  )
}

export function calcProgress(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0
}

type ProjectRow = {
  id: string
  name: string
  description: string | null
  status: string | null
  icon: string | null
  createdAt: Date
  updatedAt: Date
  _count: { tasks: number; documents: number; chats: number }
}

type MemberSummary = {
  id: string
  name: string
  email?: string
  image?: string | null
  role?: string
}

export function formatProject(
  project: ProjectRow,
  extras: {
    doneTasks: number
    members: MemberSummary[]
    integrationCount: number
  }
) {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    status: (project.status || "ACTIVE") as ProjectStatus,
    icon: project.icon || "📁",
    progress: calcProgress(extras.doneTasks, project._count.tasks),
    taskCount: project._count.tasks,
    doneTaskCount: extras.doneTasks,
    documentCount: project._count.documents,
    chatCount: project._count.chats,
    integrationCount: extras.integrationCount,
    members: extras.members,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

/** The `include` every project query needs to satisfy `formatProject`. */
export const projectInclude = {
  _count: { select: { tasks: true, documents: true, chats: true } },
} as const
