import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

/**
 * The one activity vocabulary. Everything that renders a feed reads from this
 * union — the task timeline used to invent its own lowercase types
 * (`status_change`, `pr_linked`) that no row in the table ever had.
 */
export type ActivityType =
  // Projects
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_STATUS_CHANGED"
  | "PROJECT_DELETED"
  // Tasks
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_DELETED"
  // Content
  | "DOCUMENT_UPLOADED"
  | "NOTE_CREATED"
  | "NOTE_DELETED"
  // People
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "INVITATION_SENT"
  | "INVITATION_RESENT"
  | "INVITATION_CANCELLED"
  | "INVITATION_ACCEPTED"
  // Integrations
  | "INTEGRATION_CONNECTED"

export type ActivityMetadata = {
  /** Human-readable subject of the event, e.g. a task or project name. */
  target?: string
  /** Activity has no taskId column, so task scoping rides in metadata. */
  taskId?: string
  title?: string
  name?: string
  email?: string
  integration?: string
  from?: string
  to?: string
  [key: string]: unknown
}

interface LogActivityParams {
  type: ActivityType
  workspaceId: string
  userId: string
  projectId?: string
  /** Stored in metadata so per-task feeds can filter without a schema change. */
  taskId?: string
  description?: string
  metadata?: ActivityMetadata
}

export async function logActivity({
  type,
  workspaceId,
  userId,
  projectId,
  taskId,
  description,
  metadata,
}: LogActivityParams) {
  try {
    const merged: ActivityMetadata = { ...metadata }
    if (taskId) merged.taskId = taskId
    // Callers kept forgetting `target`, leaving feeds with blank subjects.
    // Derive it from whatever identifying field the caller did pass.
    if (!merged.target) {
      const derived = resolveTarget(merged)
      if (derived) merged.target = derived
    }

    await prisma.activity.create({
      data: {
        type,
        workspaceId,
        userId,
        projectId,
        // Left null on purpose when the caller has nothing custom to say, so
        // phrasing is resolved at read time and stays current.
        description: description || null,
        // ActivityMetadata's open index signature isn't structurally assignable
        // to Prisma's InputJsonValue, but the values are JSON-safe by contract.
        metadata:
          Object.keys(merged).length > 0
            ? (merged as Prisma.InputJsonValue)
            : undefined,
      },
    })
  } catch (error) {
    // Activity logging must never break the request that triggered it.
    console.error("Failed to log activity:", error)
  }
}

function resolveTarget(metadata?: ActivityMetadata): string {
  if (!metadata) return ""
  return (
    metadata.target ||
    metadata.title ||
    metadata.name ||
    metadata.email ||
    metadata.integration ||
    ""
  )
}

/**
 * Phrasing lives here rather than being frozen into each row at write time, so
 * changing the wording updates historical rows too.
 */
export function describeActivity(
  type: ActivityType,
  metadata?: ActivityMetadata
): string {
  const target = resolveTarget(metadata)
  const quoted = target ? `"${target}"` : ""

  switch (type) {
    case "PROJECT_CREATED":
      return `created project ${quoted}`.trim()
    case "PROJECT_UPDATED":
      return `updated project ${quoted}`.trim()
    case "PROJECT_STATUS_CHANGED":
      return metadata?.to
        ? `moved ${quoted || "the project"} to ${String(metadata.to).toLowerCase().replace(/_/g, " ")}`
        : "changed project status"
    case "PROJECT_DELETED":
      return `deleted project ${quoted}`.trim()

    case "TASK_CREATED":
      return `created task ${quoted}`.trim()
    case "TASK_UPDATED":
      return `updated task ${quoted}`.trim()
    case "TASK_STATUS_CHANGED":
      return metadata?.to
        ? `moved ${quoted || "a task"} to ${String(metadata.to).toLowerCase().replace(/_/g, " ")}`
        : "changed task status"
    case "TASK_ASSIGNED":
      return metadata?.to
        ? `assigned ${quoted || "a task"} to ${metadata.to}`
        : `unassigned ${quoted || "a task"}`
    case "TASK_COMPLETED":
      return `completed task ${quoted}`.trim()
    case "TASK_DELETED":
      return `deleted task ${quoted}`.trim()

    case "DOCUMENT_UPLOADED":
      return `uploaded ${quoted || "a document"}`
    case "NOTE_CREATED":
      return `created note ${quoted}`.trim()
    case "NOTE_DELETED":
      return `deleted note ${quoted}`.trim()

    case "MEMBER_INVITED":
      return `invited ${target || "a member"}`
    case "MEMBER_JOINED":
      return "joined the workspace"
    case "INVITATION_SENT":
      return `sent an invite to ${target || "a member"}`
    case "INVITATION_RESENT":
      return `resent the invite to ${target || "a member"}`
    case "INVITATION_CANCELLED":
      return `cancelled the invite for ${target || "a member"}`
    case "INVITATION_ACCEPTED":
      return "accepted the invitation"

    case "INTEGRATION_CONNECTED":
      return `connected ${target || "an integration"}`

    default:
      return String(type).toLowerCase().replace(/_/g, " ")
  }
}

/* ── Read side ──────────────────────────────────────────────── */

export const activityInclude = {
  user: { select: { id: true, name: true, email: true, image: true } },
} as const

type ActivityRow = {
  id: string
  type: string
  description: string | null
  metadata: unknown
  projectId: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export type ActivityDTO = {
  id: string
  type: ActivityType
  description: string
  target: string
  taskId: string | null
  projectId: string | null
  createdAt: string
  user: { id: string; name: string; image: string | null }
}

/** The single response shape every activity endpoint returns. */
export function formatActivity(row: ActivityRow): ActivityDTO {
  const metadata = (row.metadata ?? {}) as ActivityMetadata
  const type = row.type as ActivityType

  return {
    id: row.id,
    type,
    description: row.description || describeActivity(type, metadata),
    target: resolveTarget(metadata),
    taskId: metadata.taskId ?? null,
    projectId: row.projectId,
    createdAt: row.createdAt.toISOString(),
    user: {
      id: row.user.id,
      name: row.user.name || row.user.email,
      image: row.user.image,
    },
  }
}
