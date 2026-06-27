import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  label: string
  className: string
  icon?: LucideIcon
}

export function StatusBadge({ label, className, icon: Icon }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {Icon && <Icon className="size-3" />}
      {label}
    </span>
  )
}
