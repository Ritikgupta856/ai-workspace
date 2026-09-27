"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Section, SectionHeading, EASE } from "@/components/landing/section"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * Two plans, priced per workspace. Pro is the one dark surface on the page so
 * the decision reads at a glance; the cards only carry what differs between
 * plans, as spec rows that line up side by side. Every line here is something
 * the app actually does — keep it that way.
 */

const INTEGRATIONS: BrandKey[] = ["github", "notion", "linear", "figma"]

function IntegrationMarks() {
  return (
    <span className="flex items-center gap-1">
      {INTEGRATIONS.map((key) => {
        const { name, Color } = BRANDS[key]
        return (
          <span
            key={key}
            title={name}
            className="flex size-5 items-center justify-center rounded-md bg-white"
          >
            <Color className="size-3" />
          </span>
        )
      })}
    </span>
  )
}

const rows: { label: string; free: React.ReactNode; pro: React.ReactNode }[] = [
  { label: "Members", free: "3", pro: "Unlimited" },
  { label: "Projects", free: "3", pro: "Unlimited" },
  { label: "AI answers / month", free: "100", pro: "2,000" },
  {
    label: "Integrations",
    free: "1 of 4",
    pro: (
      <span className="flex items-center gap-2">
        <IntegrationMarks />
        All 4
      </span>
    ),
  },
  { label: "Support", free: "Community & email", pro: "Priority email" },
]

const plans = [
  {
    key: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "For trying Synapse with a small team.",
    cta: "Start for free",
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "$19",
    period: "per workspace / month",
    blurb: "For teams that run their week in Synapse.",
    cta: "Start with Pro",
  },
]

export function Pricing() {
  return (
    <Section id="pricing" divider>
      <SectionHeading
        eyebrow="Pricing"
        title="One price for the whole workspace."
        lede="Free for small teams. When you outgrow it, Pro is $19 a month per workspace — not per seat, so adding people never raises the bill."
      />

      <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-5 md:mt-16 md:grid-cols-2">
        {plans.map((plan, i) => {
          const pro = plan.key === "pro"
          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              className={cn(
                "relative isolate flex flex-col overflow-hidden rounded-3xl p-7 sm:p-9",
                pro
                  ? "bg-ink text-white shadow-[0_30px_80px_-24px_oklch(0.55_0.21_258/0.55)]"
                  : "border-line border bg-white shadow-rest",
              )}
            >
              {pro && (
                <>
                  {/* Brand glow and a lit top edge — the only dark, lit surface on the page */}
                  <div
                    aria-hidden
                    className="bg-brand/45 pointer-events-none absolute -top-32 -right-24 -z-10 size-80 rounded-full blur-3xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  />
                </>
              )}

              <div className="flex items-center gap-2.5">
                <h3
                  className={cn(
                    "text-[18px] font-semibold tracking-[-0.015em]",
                    pro ? "text-white" : "text-ink",
                  )}
                >
                  {plan.name}
                </h3>
                {pro && (
                  <span className="bg-brand rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white">
                    Recommended
                  </span>
                )}
              </div>
              <p className={cn("mt-1.5 text-[14px]", pro ? "text-white/65" : "text-ink-soft")}>
                {plan.blurb}
              </p>

              <div className="mt-8 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-[64px] leading-none font-semibold tracking-[-0.045em] tabular-nums",
                    pro ? "text-white" : "text-ink",
                  )}
                >
                  {plan.price}
                </span>
                <span className={cn("text-[14px]", pro ? "text-white/55" : "text-ink-faint")}>
                  {plan.period}
                </span>
              </div>
              <Button
                variant={pro ? "default" : "outline"}
                className={cn(
                  "mt-6 h-12 w-full gap-2 rounded-xl text-[15px] font-medium",
                  pro
                    ? "shadow-[0_10px_30px_-10px_oklch(0.55_0.21_258/0.9)]"
                    : "border-line text-ink hover:bg-surface-1 bg-white shadow-rest",
                )}
                asChild
              >
                <Link href="/sign-up">
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <dl className="mt-8 flex flex-col">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-center justify-between gap-4 border-t py-3.5",
                      pro ? "border-white/10" : "border-line-soft",
                    )}
                  >
                    <dt className={cn("text-[14px]", pro ? "text-white/60" : "text-ink-soft")}>
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        "text-right text-[14px] font-medium tabular-nums",
                        pro ? "text-white" : "text-ink",
                      )}
                    >
                      {pro ? row.pro : row.free}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )
        })}
      </div>

      <p className="text-ink-faint mx-auto mt-8 max-w-4xl text-center text-[12.5px]">
        One AI answer is one reply from Synapse, however many steps it takes. Answers reset each
        calendar month. Prices in USD.
      </p>
    </Section>
  )
}
