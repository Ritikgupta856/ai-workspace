import { Crown, Shield, User, Eye } from "lucide-react"

export const MEMBER_ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Crown,
  },
  ADMIN: {
    label: "Admin",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Shield,
  },
  MEMBER: {
    label: "Member",
    className: "bg-muted text-muted-foreground",
    icon: User,
  },
  VIEWER: {
    label: "Viewer",
    className: "bg-muted text-muted-foreground",
    icon: Eye,
  },
} as const

export type MemberRoleKey = keyof typeof MEMBER_ROLE_CONFIG
