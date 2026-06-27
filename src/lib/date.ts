import {
  format,
  formatDistanceToNow,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isToday,
  isYesterday,
  isTomorrow,
} from "date-fns"

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  return typeof date === "string" ? new Date(date) : date
}

export function formatUpdatedDate(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ""

  const now = new Date()

  if (isToday(d)) {
    const mins = differenceInMinutes(now, d)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
    const hours = differenceInHours(now, d)
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  if (isYesterday(d)) return "Yesterday"

  if (differenceInDays(now, d) < 7) {
    const days = differenceInDays(now, d)
    return `${days} day${days === 1 ? "" : "s"} ago`
  }

  return format(d, "MMM d, yyyy")
}

export function formatDueDate(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ""

  const now = new Date()

  if (isToday(d)) return "Today"
  if (isTomorrow(d)) return "Tomorrow"
  if (isYesterday(d)) return "Yesterday"

  if (d.getFullYear() === now.getFullYear()) return format(d, "MMM d")

  return format(d, "MMM d, yyyy")
}

export function formatCreatedDate(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ""
  return format(d, "MMM d, yyyy")
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return ""
  return format(d, "MMM d, yyyy • h:mm a")
}
