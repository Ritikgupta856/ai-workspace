import { Globe, Lock, CirclePlay, CircleEllipsis, CircleCheck, Archive } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const PROJECT_STATUS_CONFIG: Record<string, {
  label: string
  className: string
  icon: LucideIcon
}> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CirclePlay,
  },
  ON_HOLD: {
    label: "On Hold",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: CircleEllipsis,
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CircleCheck,
  },
  ARCHIVED: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
    icon: Archive,
  },
} as const

export type ProjectStatusKey = keyof typeof PROJECT_STATUS_CONFIG

export const PROJECT_VISIBILITY_CONFIG = {
  PUBLIC: {
    label: "Public",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: Globe,
  },
  PRIVATE: {
    label: "Private",
    className: "bg-muted text-muted-foreground",
    icon: Lock,
  },
} as const

export type ProjectVisibilityKey = keyof typeof PROJECT_VISIBILITY_CONFIG
