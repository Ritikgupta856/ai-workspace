import Link from "next/link"
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react"

import type { Delta } from "@/lib/dashboard"
import { cn } from "@/lib/utils"

/**
 * One cell of the dashboard's stat bar.
 *
 * These used to be four separately-bordered floating cards, which read as four
 * unrelated objects that happened to line up. They are one measurement of one
 * workspace, so they now share a single frame: `MetricBar` draws the border and
 * radius, and hairlines between cells come from the parent's `gap-px` over a
 * `bg-border` ground — which survives any wrap configuration, unlike
 * `divide-x`, which leaves a stray rule at the wrap point.
 *
 * The tile also used to carry a `unit` line that only repeated the label
 * ("Projects" above "Projects"). With it gone and the ratio bar down from 10px
 * to a 3px rule, the value is unambiguously the loudest thing in the cell.
 */

const TONES = {
  violet: {
    fill: "bg-violet-500",
    track: "bg-violet-500/15",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    fill: "bg-amber-500",
    track: "bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    fill: "bg-emerald-500",
    track: "bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    fill: "bg-blue-500",
    track: "bg-blue-500/15",
    icon: "text-blue-600 dark:text-blue-400",
  },
} as const

export type MetricTone = keyof typeof TONES

/** The shared frame. Cells are `MetricCard`s. */
export function MetricBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-border grid gap-px overflow-hidden rounded-xl border shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  )
}

function DeltaChip({ delta }: { delta: Delta }) {
  if (!delta) {
    return <span className="text-muted-foreground text-xs">No prior data</span>
  }

  if (delta.direction === "flat") {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
        <Minus className="size-3" />
        No change
      </span>
    )
  }

  const up = delta.direction === "up"
  const Icon = up ? TrendingUp : TrendingDown

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        up
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25"
          : "bg-muted text-muted-foreground ring-border"
      )}
      title={`${up ? "Up" : "Down"} ${delta.percent}% vs last week`}
    >
      <Icon className="size-3" />
      {up ? "+" : "−"}
      {delta.percent}%
    </span>
  )
}

export function MetricCard({
  label,
  value,
  delta,
  ratio,
  ratioLabel,
  tone,
  href,
  icon: Icon,
}: {
  label: string
  value: number
  delta: Delta
  ratio: number
  ratioLabel: string
  tone: MetricTone
  href: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  const { fill, track, icon } = TONES[tone]
  const clamped = Math.min(Math.max(ratio, 0), 100)

  return (
    <Link
      href={href}
      className="group bg-card hover:bg-accent/40 focus-visible:ring-ring flex flex-col p-5 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-[13px] font-medium">
          {Icon && <Icon className={cn("size-4", icon)} />}
          {label}
        </span>
        <ArrowUpRight className="text-muted-foreground/0 group-hover:text-muted-foreground size-4 shrink-0 transition-colors" />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
        <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        <DeltaChip delta={delta} />
      </div>

      <div
        className={cn(
          "mt-5 h-0.75 w-full overflow-hidden rounded-full",
          track
        )}
        role="img"
        aria-label={`${clamped}% ${ratioLabel}`}
      >
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-muted-foreground mt-2 text-[11px] tabular-nums">
        <span className="text-foreground font-medium">{clamped}%</span>{" "}
        {ratioLabel}
      </p>
    </Link>
  )
}
