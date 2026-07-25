"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Lock } from "lucide-react"
import { EASE } from "@/components/landing/section"
import { SlackColor, GitHubColor } from "@/components/landing/brand-logos"

export function ProductPreview() {
  return (
    <section id="product" className="relative px-5 pb-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-280"
      >
        {/* App frame */}
        <div className="border-line relative overflow-hidden rounded-xl border bg-white shadow-frame">
          {/* Browser chrome — real proportions, real URL */}
          <div className="border-line-soft bg-surface-1 flex h-10 items-center gap-3 border-b px-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[oklch(0.87_0.01_250)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.87_0.01_250)]" />
              <span className="size-2.5 rounded-full bg-[oklch(0.87_0.01_250)]" />
            </div>
            <div className="border-line-soft text-ink-faint mx-auto flex h-6 w-full max-w-70 items-center justify-center gap-1.5 rounded-md border bg-white text-[11px]">
              <Lock className="size-3" strokeWidth={2.25} />
              app.synapse.so
            </div>
            <div className="w-13.5" />
          </div>

          {/* Screenshot */}
          <Image
            src="/images/preview-1.png"
            alt="The Synapse workspace: project overview with tasks, activity and the AI panel"
            width={2240}
            height={1260}
            className="block w-full"
            priority
          />
        </div>

        {/* One overlapping card, and it says something concrete about the
            product rather than floating there for decoration. */}
        <motion.div
          initial={{ opacity: 0, y: 12, x: -8 }}
          whileInView={{ opacity: 1, y: 0, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          className="border-line absolute -bottom-7 left-6 hidden w-67 rounded-xl border bg-white p-3.5 shadow-lift lg:block"
        >
          <span className="text-ink-faint text-[11px] font-semibold tracking-[0.12em] uppercase">
            Answered from
          </span>
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <GitHubColor className="size-4 shrink-0" />
              <span className="text-ink truncate text-[13px]">
                PR #342 · OAuth provider
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <SlackColor className="size-4 shrink-0" />
              <span className="text-ink truncate text-[13px]">
                #eng-platform · 4 messages
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
