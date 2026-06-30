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

export interface StatsData {
  tasks: { total: number; weeklyChange: number; trend: number[] }
  documents: { total: number; newThisWeek: number }
  chats: { total: number; weeklyIncrease: number }
  integrations: { total: number; connected: number; disconnected: number }
}

interface SummaryCardProps {
  title: string
  value: number
  trend: string
  trendingUp: boolean
  icon: React.ReactNode
  sparkline: number[]
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
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

function SummaryCard({ title, value, trend, trendingUp, icon, sparkline }: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MiniSparkline data={sparkline} />
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trendingUp ? "text-emerald-600" : "text-muted-foreground"
            )}
          >
            {trendingUp ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SummaryCards({ stats }: { stats: StatsData }) {
  const cards = [
    {
      title: "Tasks",
      value: stats.tasks.total,
      trend: `+${stats.tasks.weeklyChange} this week`,
      trendingUp: stats.tasks.weeklyChange > 0,
      icon: <ListTree className="size-5 text-emerald-600" />,
      sparkline: stats.tasks.trend,
    },
    {
      title: "Documents",
      value: stats.documents.total,
      trend: `+${stats.documents.newThisWeek} new`,
      trendingUp: stats.documents.newThisWeek > 0,
      icon: <FileText className="size-5 text-blue-600" />,
      sparkline: [],
    },
    {
      title: "Chats",
      value: stats.chats.total,
      trend: `+${stats.chats.weeklyIncrease} this week`,
      trendingUp: stats.chats.weeklyIncrease > 0,
      icon: <MessageSquare className="size-5 text-violet-600" />,
      sparkline: [],
    },
    {
      title: "Integrations",
      value: stats.integrations.total,
      trend: `${stats.integrations.connected} connected`,
      trendingUp: stats.integrations.connected > 0,
      icon: <Puzzle className="size-5 text-amber-600" />,
      sparkline: [],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  )
}
