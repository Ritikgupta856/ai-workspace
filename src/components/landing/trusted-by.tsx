"use client"

import { motion } from "framer-motion"

const logos = [
  { name: "GitHub", color: "currentColor" },
  { name: "Vercel", color: "currentColor" },
  { name: "Notion", color: "currentColor" },
  { name: "Linear", color: "currentColor" },
  { name: "Slack", color: "currentColor" },
  { name: "Figma", color: "currentColor" },
]

export function TrustedBy() {
  return (
    <section className="border-y border-border/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-sm text-muted-foreground"
        >
          Trusted by developers and modern teams
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="opacity-40 transition-opacity hover:opacity-70"
            >
              <span className="text-lg font-semibold tracking-tight text-foreground/60">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
