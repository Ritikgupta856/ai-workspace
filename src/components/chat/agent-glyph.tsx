import { cn } from "@/lib/utils"

/** The agent's multicolour mark — used in the breadcrumb, chat picker and history cards. */
export function AgentGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3.5 shrink-0 rounded-full",
        "bg-[conic-gradient(from_200deg,#f97316,#ec4899,#8b5cf6,#0ea5e9,#22c55e,#f97316)]",
        "ring-2 ring-white/70 dark:ring-black/30",
        className
      )}
    />
  )
}
