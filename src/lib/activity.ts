export type ActivityType =
  | "INVITATION_SENT"
  | "INVITATION_RESENT"
  | "INVITATION_CANCELLED"
  | "INVITATION_ACCEPTED"

interface LogActivityParams {
  type: ActivityType
  workspaceId: string
  userId: string
  metadata?: Record<string, any>
}

export function logActivity({ type, workspaceId, userId, metadata }: LogActivityParams) {
  console.log(`[ACTIVITY LOG] [${new Date().toISOString()}] User: ${userId} | Workspace: ${workspaceId} | Event: ${type}`, metadata ? `| Meta: ${JSON.stringify(metadata)}` : "")
}
