"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * One shell for every landing section. Vertical rhythm, container width, and
 * the eyebrow/title/lede stack all live here — so no section can drift.
 */

export const EASE = [0.16, 1, 0.3, 1] as const

export const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: EASE },
} as const

export function Section({
  id,
  className,
  children,
  tone = "page",
  divider = false,
}: {
  id?: string
  className?: string
  children: React.ReactNode
  tone?: "page" | "subtle"
  divider?: boolean
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 md:py-28",
        tone === "subtle" && "bg-surface-1",
        className,
      )}
    >
      {divider && <div className="lp-rule absolute inset-x-0 top-0" />}
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-brand-ink uppercase">
      <span className="size-1.5 rounded-full bg-brand" />
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  lede?: React.ReactNode
  align?: "center" | "left"
  className?: string
}) {
  return (
    <motion.div
      {...reveal}
      className={cn(
        "flex max-w-2xl flex-col",
        align === "center"
          ? "mx-auto items-center text-center"
          : "items-start text-left",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "text-ink text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] text-pretty sm:text-[34px] md:text-[40px]",
          eyebrow && "mt-4",
        )}
      >
        {title}
      </h2>
      {lede && (
        <p className="text-ink-soft mt-4 text-[15px] leading-[1.65] md:text-base">
          {lede}
        </p>
      )}
    </motion.div>
  )
}
