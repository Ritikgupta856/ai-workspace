import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export const INTEGRATION_STATUS_CONFIG = {
  CONNECTED: {
    label: "Connected",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  DISCONNECTED: {
    label: "Disconnected",
    className: "bg-muted text-muted-foreground",
    icon: XCircle,
  },
  ERROR: {
    label: "Error",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertTriangle,
  },
  SYNCING: {
    label: "Syncing",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: RefreshCw,
  },
} as const

export type IntegrationStatusKey = keyof typeof INTEGRATION_STATUS_CONFIG
