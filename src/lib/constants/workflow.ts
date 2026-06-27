import { Clock, LoaderCircle, CheckCircle2, XCircle } from "lucide-react"

export const WORKFLOW_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  RUNNING: {
    label: "Running",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: LoaderCircle,
  },
  SUCCESS: {
    label: "Success",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
} as const

export type WorkflowStatusKey = keyof typeof WORKFLOW_STATUS_CONFIG
