import { cn } from "@/lib/utils"

/**
 * Fourteen-day task trend, drawn with plain divs — the shapes here are bars and
 * gridlines, which is not worth a charting dependency.
 *
 * Both series share one scale so the two bars in a day are comparable.
 */

type TrendPoint = {
  date: string
  label: string
  created: number
  completed: number
}

function niceCeiling(max: number) {
  if (max <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / magnitude) * magnitude
}

export function ActivityChart({ trend }: { trend: TrendPoint[] }) {
  const peak = Math.max(1, ...trend.map((d) => Math.max(d.created, d.completed)))
  const ceiling = niceCeiling(peak)
  const ticks = [ceiling, Math.round(ceiling / 2), 0]

  const totalCreated = trend.reduce((sum, d) => sum + d.created, 0)
  const totalCompleted = trend.reduce((sum, d) => sum + d.completed, 0)

  return (
    <section className="bg-card flex flex-col rounded-xl border shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-4 pb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">Task activity</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Created and completed over the last 14 days
          </p>
        </div>

        {/* Totals sit in the legend so the swatch, the word and the number the
            swatch refers to are one object, rather than a key here and a stat
            block somewhere else on the card. */}
        <div className="flex shrink-0 items-center gap-4">
          <Legend swatch="bg-violet-400" label="Created" value={totalCreated} />
          <Legend
            swatch="bg-emerald-500"
            label="Completed"
            value={totalCompleted}
          />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex gap-3">
          {/* Y axis */}
          <div className="text-muted-foreground flex h-44 shrink-0 flex-col justify-between py-px text-[11px] tabular-nums">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-44">
              {/* Gridlines sit behind the bars at the same three tick stops.
                  The baseline is solid and the rest are faint, so the zero line
                  reads as the floor of the chart rather than as one more rule. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {ticks.map((tick, i) => (
                  <span
                    key={tick}
                    className={cn(
                      "h-px w-full",
                      i === ticks.length - 1 ? "bg-border" : "bg-border/60"
                    )}
                  />
                ))}
              </div>

              <div className="relative flex h-full items-end gap-[3px]">
                {trend.map((day) => (
                  <div
                    key={day.date}
                    className="group hover:bg-accent/40 flex h-full flex-1 items-end justify-center gap-[2px] rounded-sm transition-colors"
                    title={`${day.label} · ${day.created} created, ${day.completed} completed`}
                  >
                    <Bar
                      value={day.created}
                      ceiling={ceiling}
                      tone="bg-violet-300 group-hover:bg-violet-400 dark:bg-violet-400/70 dark:group-hover:bg-violet-400"
                    />
                    <Bar
                      value={day.completed}
                      ceiling={ceiling}
                      tone="bg-emerald-400 group-hover:bg-emerald-500 dark:bg-emerald-400/80 dark:group-hover:bg-emerald-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="text-muted-foreground mt-2 flex gap-[3px] text-[10px]">
              {trend.map((day, i) => (
                <span
                  key={day.date}
                  className="flex-1 text-center whitespace-nowrap tabular-nums"
                >
                  {/* Every other label, so 14 days never collide */}
                  {i % 2 === 0 ? day.label.split(" ")[1] : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Bar({
  value,
  ceiling,
  tone,
}: {
  value: number
  ceiling: number
  tone: string
}) {
  // A zero day still gets a sliver, so the column reads as "nothing" rather
  // than as missing data.
  const height = value === 0 ? 2 : Math.max((value / ceiling) * 100, 4)

  return (
    <div
      className={cn(
        "w-full max-w-3 rounded-t-[3px] transition-colors",
        value === 0 ? "bg-border" : tone
      )}
      style={{ height: `${height}%` }}
    />
  )
}

function Legend({
  swatch,
  label,
  value,
}: {
  swatch: string
  label: string
  value: number
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn("size-2 rounded-full", swatch)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  )
}
