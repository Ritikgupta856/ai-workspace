"use client"

import { Shimmer } from "@/components/ai-elements/shimmer"

export function ThinkingIndicator() {
  return (
    <div className="flex h-7 items-center" role="status" aria-label="Synapse is responding">
      <Shimmer className="text-[15px]">Thinking…</Shimmer>
    </div>
  )
}
