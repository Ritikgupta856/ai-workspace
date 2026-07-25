import Link from "next/link"
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react"

import type { Delta } from "@/lib/dashboard"
import { cn } from "@/lib/utils"

/**
 * Metric tile: label, value, movement, and a bar showing one real proportion of
 * that metric. The bar is never decorative — `ratioLabel` says what it measures.
 */

const TONES = {
  violet: { fill: "bg-violet-500", track: "bg-violet-100 dark:bg-violet-950/40" },
  amber: { fill: "bg-amber-500", track: "bg-amber-100 dark:bg-amber-950/40" },
  emerald: {
    fill: "bg-emerald-500",
    track: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  blue: { fill: "bg-blue-500", track: "bg-blue-100 dark:bg-blue-950/40" },
} as const

export type MetricTone = keyof typeof TONES

function DeltaChip({ delta }: { delta: Delta }) {
  if (!delta) {
    return <span className="text-muted-foreground text-xs">No prior data</span>
  }
  if (delta.direction === "flat") {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Minus className="size-3" />
        Flat <span className="text-muted-foreground">vs last week</span>
      </span>
    )
  }
  const up = delta.direction === "up"
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Icon
        className={cn("size-3", up ? "text-emerald-600" : "text-muted-foreground")}
      />
      <span
        className={cn(
          "font-medium",
          up ? "text-emerald-600" : "text-muted-foreground"
        )}
      >
        {up ? "+" : "−"}
        {delta.percent}%
      </span>
      <span className="text-muted-foreground">vs last week</span>
    </span>
  )
}

export function MetricCard({
  label,
  unit,
  value,
  delta,
  ratio,
  ratioLabel,
  tone,
  href,
}: {
  label: string
  unit: string
  value: number
  delta: Delta
  ratio: number
  ratioLabel: string
  tone: MetricTone
  href: string
}) {
  const { fill, track } = TONES[tone]

  return (
    <Link
      href={href}
      className="group hover:border-foreground/15 flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-muted-foreground text-[13px]">{label}</span>
        <ArrowUpRight className="text-muted-foreground/50 group-hover:text-foreground size-4 transition-colors" />
      </div>

      <p className="mt-3 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-muted-foreground text-[13px]">{unit}</span>
        <DeltaChip delta={delta} />
      </div>

      <div
        className={cn("mt-4 h-2.5 w-full overflow-hidden rounded-full", track)}
        role="img"
        aria-label={`${ratio}% ${ratioLabel}`}
      >
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${Math.min(Math.max(ratio, 0), 100)}%` }}
        />
      </div>
      <p className="text-muted-foreground mt-2 text-[11px] tabular-nums">
        {ratio}% {ratioLabel}
      </p>
    </Link>
  )
}
