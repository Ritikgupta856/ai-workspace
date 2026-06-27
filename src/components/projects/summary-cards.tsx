"use client"

import * as React from "react"
import {
  ListTree,
  FileText,
  MessageSquare,
  Puzzle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SummaryCardData {
  title: string
  value: number
  trend: string
  trendingUp: boolean
  icon: React.ReactNode
  sparkline: number[]
}

const cards: SummaryCardData[] = [
  {
    title: "Tasks",
    value: 156,
    trend: "+12% this week",
    trendingUp: true,
    icon: <ListTree className="size-5 text-emerald-600" />,
    sparkline: [12, 19, 15, 22, 18, 25, 20],
  },
  {
    title: "Documents",
    value: 43,
    trend: "+5 new",
    trendingUp: true,
    icon: <FileText className="size-5 text-blue-600" />,
    sparkline: [8, 10, 6, 12, 9, 11, 7],
  },
  {
    title: "Chats",
    value: 287,
    trend: "+23% this week",
    trendingUp: true,
    icon: <MessageSquare className="size-5 text-violet-600" />,
    sparkline: [30, 45, 38, 52, 41, 48, 55],
  },
  {
    title: "Integrations",
    value: 6,
    trend: "No change",
    trendingUp: false,
    icon: <Puzzle className="size-5 text-amber-600" />,
    sparkline: [3, 3, 4, 4, 5, 5, 6],
  },
]

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 60
  const height = 24
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  const pathD = `M${points.join(" L")}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/40"
      />
    </svg>
  )
}

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <MiniSparkline data={card.sparkline} />
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  card.trendingUp ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                {card.trendingUp ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {card.trend}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
