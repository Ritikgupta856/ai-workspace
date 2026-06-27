"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function ProductPreview() {
  return (
    <section className="relative px-4 pb-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-6xl"
      >
        {/* Fade-to-background mask */}
        <div className="rounded-2xl mask-[linear-gradient(to_bottom,white_40%,transparent_100%)]">
          <Image
            src="/images/preview-1.png"
            alt="Synapse"
            width={1000}
            height={600}
            className="mx-auto w-full rounded-2xl border border-border bg-muted object-cover shadow-xl"
          />
        </div>
      </motion.div>
    </section>
  )
}
