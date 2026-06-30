"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "./chat-provider"

type ToolActivityData = {
  id: string
  tool: string
  label: string
  status: "running" | "completed" | "error"
  result?: string
}

export function ToolActivityCard({
  activity,
  index,
}: {
  activity: ToolActivityData
  index: number
}) {
  const isRunning = activity.status === "running"

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2",
        isRunning
          ? "bg-muted/30 border-muted"
          : "bg-muted/10 border-muted/50"
      )}
    >
      <div className={cn(
        "flex size-6 items-center justify-center rounded-md",
        isRunning ? "bg-primary/10" : "bg-muted"
      )}>
        {isRunning ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="size-3.5 text-green-600" />
        )}
      </div>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="text-xs font-medium capitalize">{activity.tool}</span>
        <span className="text-xs text-muted-foreground truncate">
          {activity.label}
        </span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {isRunning ? "Running..." : "Completed"}
      </span>
    </motion.div>
  )
}

export function ToolActivityList({
  activities,
}: {
  activities: ToolActivityData[]
}) {
  if (activities.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 pl-10">
      <AnimatePresence mode="popLayout">
        {activities.map((activity, i) => (
          <ToolActivityCard key={activity.id} activity={activity} index={i} />
        ))}
      </AnimatePresence>
    </div>
  )
}
