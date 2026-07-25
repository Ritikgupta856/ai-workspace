import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileUp,
  FolderKanban,
  FolderPlus,
  Mail,
  MailCheck,
  MailMinus,
  NotebookPen,
  PenLine,
  PenTool,
  PlugZap,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { ActivityType } from "@/lib/activity"

/**
 * Typed as an exhaustive Record over ActivityType, not Record<string, …>.
 * Adding a new activity type is a compile error until it gets a label here,
 * which is how we avoid events silently falling through to a generic "Event"
 * badge the way they used to.
 */
export const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; className: string; icon: LucideIcon }
> = {
  PROJECT_CREATED: {
    label: "Project",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: FolderPlus,
  },
  PROJECT_UPDATED: {
    label: "Project",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: PenLine,
  },
  PROJECT_STATUS_CHANGED: {
    label: "Project",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: FolderKanban,
  },
  PROJECT_DELETED: {
    label: "Project",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: Trash2,
  },

  TASK_CREATED: {
    label: "Task",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  TASK_UPDATED: {
    label: "Task",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: PenLine,
  },
  TASK_STATUS_CHANGED: {
    label: "Status",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: ArrowRight,
  },
  TASK_ASSIGNED: {
    label: "Assigned",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Users,
  },
  TASK_COMPLETED: {
    label: "Done",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  TASK_DELETED: {
    label: "Task",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: Trash2,
  },

  DOCUMENT_UPLOADED: {
    label: "Doc",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: FileUp,
  },
  NOTE_CREATED: {
    label: "Note",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: NotebookPen,
  },
  NOTE_DELETED: {
    label: "Note",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: Trash2,
  },
  WHITEBOARD_CREATED: {
    label: "Board",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: PenTool,
  },
  MEMBER_INVITED: {
    label: "Member",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: UserPlus,
  },
  MEMBER_JOINED: {
    label: "Member",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Users,
  },
  INVITATION_SENT: {
    label: "Invite",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Mail,
  },
  INVITATION_RESENT: {
    label: "Invite",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Mail,
  },
  INVITATION_CANCELLED: {
    label: "Invite",
    className: "bg-muted text-muted-foreground",
    icon: MailMinus,
  },
  INVITATION_ACCEPTED: {
    label: "Joined",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: MailCheck,
  },

  INTEGRATION_CONNECTED: {
    label: "Integration",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: PlugZap,
  },
}

/**
 * Rows written before a type existed — or by a future version — still need to
 * render, so lookups go through `activityConfig` rather than indexing directly.
 */
export const ACTIVITY_FALLBACK = {
  label: "Event",
  className: "bg-muted text-muted-foreground",
  icon: Activity,
} satisfies { label: string; className: string; icon: LucideIcon }

export function activityConfig(type: string) {
  return ACTIVITY_CONFIG[type as ActivityType] ?? ACTIVITY_FALLBACK
}
