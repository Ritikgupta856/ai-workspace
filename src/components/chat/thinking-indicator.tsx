"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ThinkingIndicator({ phase }: { phase: "thinking" | "streaming" }) {
  return (
    <div className="flex items-start gap-3 px-1">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="size-4 text-primary"
          aria-hidden="true"
        >
          <path
            d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M16 6c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6z"
            fill="currentColor"
            opacity="0.4"
          />
          <path
            d="M16 10c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-sm text-muted-foreground">
          {phase === "thinking" ? "Synapse is thinking..." : "Synapse is responding..."}
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block size-1.5 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TypingCursor() {
  return (
    <motion.span
      className="inline-block size-[3px] rounded-full bg-foreground ml-0.5 align-middle"
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}
