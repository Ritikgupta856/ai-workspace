import {
  CircleDashed,
  LoaderCircle,
  Eye,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react"

export const TASK_STATUS_CONFIG = {
  TODO: {
    label: "Todo",
    className: "bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: LoaderCircle,
  },
  IN_REVIEW: {
    label: "In Review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Eye,
  },
  DONE: {
    label: "Done",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
} as const

export const TASK_PRIORITY_CONFIG = {
  LOW: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
    icon: ArrowDown,
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: ArrowRight,
  },
  HIGH: {
    label: "High",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: ArrowUp,
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertTriangle,
  },
} as const

export type TaskStatusKey = keyof typeof TASK_STATUS_CONFIG
export type TaskPriorityKey = keyof typeof TASK_PRIORITY_CONFIG
