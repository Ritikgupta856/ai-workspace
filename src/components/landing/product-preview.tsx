"use client"

import { motion } from "framer-motion"
import { EASE } from "@/components/landing/section"
import { ScreenshotFrame } from "@/components/landing/screenshot-frame"

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
        {/* Soft brand glow the frame sits on */}
        <div
          aria-hidden
          className="bg-brand/15 pointer-events-none absolute inset-x-[12%] -bottom-8 -z-10 h-40 rounded-full blur-3xl"
        />

        {/* Cropped short so the board runs off the bottom edge. */}
        <ScreenshotFrame
          src="/images/hero-kanban.png"
          alt="The Synapse workspace: the Auth & Security project's tasks on a Kanban board, from backlog to completed"
          width={2880}
          height={1800}
          sizes="(min-width: 1152px) 1120px, 100vw"
          priority
          cropClassName="aspect-2/1"
        />
      </motion.div>
    </section>
  )
}
