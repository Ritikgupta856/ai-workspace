import { prisma } from "@/lib/prisma"

export type ActivityType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "TASK_DELETED"
  | "TASK_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "INTEGRATION_CONNECTED"
  | "CHAT_CREATED"
  | "INVITATION_SENT"
  | "INVITATION_RESENT"
  | "INVITATION_CANCELLED"
  | "INVITATION_ACCEPTED"

interface LogActivityParams {
  type: ActivityType
  workspaceId: string
  userId: string
  projectId?: string
  description?: string
  metadata?: Record<string, any>
}

export async function logActivity({
  type,
  workspaceId,
  userId,
  projectId,
  description,
  metadata,
}: LogActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        type,
        workspaceId,
        userId,
        projectId,
        description: description || getDefaultDescription(type, metadata),
        metadata: metadata || undefined,
      },
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

function getDefaultDescription(type: ActivityType, metadata?: Record<string, any>): string {
  switch (type) {
    case "PROJECT_CREATED":
      return "Created this project"
    case "PROJECT_UPDATED":
      return "Updated project settings"
    case "MEMBER_INVITED":
      return `Invited ${metadata?.email || "a member"} to the workspace`
    case "MEMBER_JOINED":
      return "Joined the workspace"
    case "TASK_CREATED":
      return `Created task "${metadata?.title || "Untitled"}"`
    case "TASK_COMPLETED":
      return `Completed task "${metadata?.title || "Untitled"}"`
    case "TASK_DELETED":
      return `Deleted task "${metadata?.title || "Untitled"}"`
    case "TASK_UPDATED":
      return `Updated task "${metadata?.title || "Untitled"}"`
    case "DOCUMENT_UPLOADED":
      return `Uploaded document "${metadata?.title || "Untitled"}"`
    case "INTEGRATION_CONNECTED":
      return `Connected ${metadata?.integration || "integration"}`
    case "CHAT_CREATED":
      return `Started chat "${metadata?.title || "Untitled"}"`
    default:
      return ""
  }
}
