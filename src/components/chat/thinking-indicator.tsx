"use client"

import { motion } from "framer-motion"

/**
 * A single breathing dot where the answer is about to appear — the same mark
 * Streamdown leaves as the caret once text starts streaming, so the hand-off
 * from "working" to "writing" reads as one continuous state.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex h-7 items-center" role="status" aria-label="Synapse is responding">
      <motion.span
        className="block size-3 rounded-full bg-foreground"
        animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
