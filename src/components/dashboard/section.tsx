import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A banded section: 40px muted band with icon, mono title, optional count
 * chip and a right-hand action or aside, then whatever rows follow. Server-safe
 * (no hooks) so both server pages and client views can use it.
 */
export function Section({
  icon: Icon,
  title,
  count,
  action,
  aside,
  className,
  children,
}: {
  icon: LucideIcon
  title: string
  count?: number | null
  action?: { label: string; href: string }
  /** Custom right-hand content (a pill, a legend) instead of a link. */
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      <div className="flex h-10 items-center justify-between rounded-lg bg-muted/60 px-4 dark:bg-muted/40">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs font-medium text-foreground">{title}</span>
          {count != null && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border/80 bg-card px-1 font-mono text-[10px] leading-none text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {aside ??
          (action && (
            <Link
              href={action.href}
              className="shrink-0 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {action.label}
            </Link>
          ))}
      </div>
      <div className="flex flex-col pt-1">{children}</div>
    </section>
  )
}

/** Muted single-line placeholder for an empty section. */
export function SectionEmpty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">{children}</p>
}

/** 44px hover row shared by section lists. */
export const sectionRowClass =
  "flex h-11 items-center gap-3 rounded-lg border border-transparent px-4 transition-colors hover:border-border hover:bg-muted/40"
