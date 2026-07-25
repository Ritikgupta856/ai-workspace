"use client"

import { motion } from "framer-motion"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"
import { reveal } from "@/components/landing/section"

/**
 * A logo strip that claims what's true: these are the tools Synapse connects
 * to, not customers we can't name. Monochrome marks at one optical size so the
 * row reads as a single band rather than eight competing brands.
 */

const ORDER: BrandKey[] = [
  "github",
  "slack",
  "notion",
  "linear",
  "figma",
  "drive",
  "asana",
  "discord",
  "vercel",
]

function LogoRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {ORDER.map((key) => {
        const { name, Mono } = BRANDS[key]
        return (
          <div
            key={key}
            className="text-ink-faint hover:text-ink flex items-center gap-2.5 px-7 transition-colors duration-300"
          >
            <Mono className="size-5 shrink-0" />
            <span className="text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap">
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function TrustedBy() {
  return (
    <section className="relative py-14 md:py-16">
      <div className="lp-rule absolute inset-x-0 top-0" />
      <div className="lp-rule absolute inset-x-0 bottom-0" />

      <motion.p
        {...reveal}
        className="text-ink-faint mb-9 text-center text-[13px] tracking-[-0.005em]"
      >
        Connects to the tools your team already works in
      </motion.p>

      <div className="lp-marquee lp-mask-x overflow-hidden">
        <div className="lp-marquee-track">
          <LogoRow />
          {/* Duplicate for the seamless -50% loop; hidden from a11y tree. */}
          <LogoRow ariaHidden />
        </div>
      </div>
    </section>
  )
}
