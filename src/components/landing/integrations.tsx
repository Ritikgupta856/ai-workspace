"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section, Eyebrow, EASE, reveal } from "@/components/landing/section"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"
import { RingBackdrop, SynapseGlyph } from "@/components/landing/illustrations"

/**
 * Eight real brands on a ring. The chips counter-rotate against the ring so the
 * logos stay upright while the orbit turns — the whole thing pauses for anyone
 * with reduced-motion on.
 */

const ORBIT: BrandKey[] = [
  "github",
  "slack",
  "linear",
  "notion",
  "figma",
  "drive",
  "asana",
  "discord",
]

/** Percentage offsets on a 400×400 ring at r = 148. */
const RADIUS_PCT = 37

export function Integrations() {
  return (
    <Section id="integrations" divider>
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        {/* ── Copy ─────────────────────────────────────────── */}
        <motion.div {...reveal}>
          <Eyebrow>Integrations</Eyebrow>
          <h2 className="text-ink mt-4 text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[34px] md:text-[40px]">
            Your tools stay where they are. The context comes to Synapse.
          </h2>
          <p className="text-ink-soft mt-4 text-[15px] leading-[1.65] md:text-base">
            Connect a source once and it keeps syncing. Nobody has to change how
            they work, and nothing has to be pasted into a chat box.
          </p>

          <ul className="divide-line-soft border-line mt-8 divide-y overflow-hidden rounded-xl border bg-white shadow-rest">
            {ORBIT.slice(0, 5).map((key) => {
              const { name, Color, syncs } = BRANDS[key]
              return (
                <li
                  key={key}
                  className="hover:bg-surface-1 flex items-center gap-3 px-4 py-3 transition-colors"
                >
                  <Color className="size-4.5 shrink-0" />
                  <span className="text-ink w-24 shrink-0 text-[13.5px] font-medium">
                    {name}
                  </span>
                  <span className="text-ink-faint truncate text-[13px]">
                    {syncs}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
              variant="outline"
              className="border-line text-ink hover:bg-surface-1 h-10 gap-2 rounded-lg bg-white text-[14px] font-medium shadow-rest"
              asChild
            >
              <a href="/integrations">
                Browse all integrations
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <span className="text-ink-faint text-[13px]">
              Plus Figma, Drive, Asana and Discord
            </span>
          </div>
        </motion.div>

        {/* ── Orbit ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative mx-auto aspect-square w-full max-w-105"
        >
          <RingBackdrop className="absolute inset-0 h-full w-full" />

          {/* Rotating carrier. Chips counter-rotate to stay upright. */}
          <div className="lp-orbit absolute inset-0">
            {ORBIT.map((key, i) => {
              const angle = (i / ORBIT.length) * 2 * Math.PI - Math.PI / 2
              const left = 50 + Math.cos(angle) * RADIUS_PCT
              const top = 50 + Math.sin(angle) * RADIUS_PCT
              const { name, Color } = BRANDS[key]
              return (
                <div
                  key={key}
                  className="absolute"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="lp-orbit-counter border-line flex size-12 items-center justify-center rounded-xl border bg-white shadow-rest sm:size-14"
                    title={name}
                  >
                    <Color className="size-6 sm:size-6.5" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Static hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="border-line flex size-17 items-center justify-center rounded-2xl border bg-white shadow-lift">
              <svg viewBox="0 0 28 28" className="size-9" aria-hidden="true">
                <SynapseGlyph x={0} y={0} size={28} />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}
