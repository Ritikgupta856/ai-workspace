"use client"

import { motion } from "framer-motion"
import {
  ConnectIllustration,
  UnderstandIllustration,
  ActIllustration,
} from "@/components/landing/illustrations"
import { Section, SectionHeading, EASE } from "@/components/landing/section"

const steps = [
  {
    step: "01",
    title: "Connect your sources",
    body: "Point Synapse at a repo, a Slack channel, a Drive folder. Everything is parsed, chunked and embedded — no schema work on your side.",
    Illustration: ConnectIllustration,
  },
  {
    step: "02",
    title: "Ask in plain language",
    body: "Retrieval runs across the whole index, not one tool at a time. Every answer arrives with the passages it was built from.",
    Illustration: UnderstandIllustration,
  },
  {
    step: "03",
    title: "Turn answers into work",
    body: "Generate tasks from a spec, assign them, and track them on the same board your team already uses. Nothing gets copied by hand.",
    Illustration: ActIllustration,
  },
]

export function HowItWorks() {
  return (
    <Section id="how-it-works" tone="subtle" divider>
      <SectionHeading
        eyebrow="How it works"
        title="Three steps from scattered tools to a single source of answers."
      />

      <div className="mt-14 grid gap-4 md:mt-16 md:grid-cols-3">
        {steps.map(({ step, title, body, Illustration }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
            className="lp-lift flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-rest"
          >
            {/* Illustration sits on its own tinted plate so the three read as a
                set even though each drawing is different. */}
            <div className="border-line-soft lp-dots border-b bg-white/40 px-5 pt-6 pb-4">
              <Illustration className="mx-auto h-auto w-full max-w-[320px]" />
            </div>

            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-2.5">
                <span className="border-line text-ink-faint flex h-5 items-center rounded border px-1.5 font-mono text-[10px] tracking-[0.08em]">
                  {step}
                </span>
                <h3 className="text-ink text-[15px] font-semibold tracking-[-0.015em]">
                  {title}
                </h3>
              </div>
              <p className="text-ink-soft mt-2.5 text-[13.5px] leading-[1.6]">
                {body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
