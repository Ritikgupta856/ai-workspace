"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EASE, Eyebrow, reveal } from "@/components/landing/section"
import {
  GitHubColor,
  NotionColor,
  LinearColor,
} from "@/components/landing/brand-logos"
import { SynapseGlyph } from "@/components/landing/illustrations"

/**
 * Closing call to action. The ask sits on the left; on the right, one small
 * answer with its citations — the page ends by showing the thing it's been
 * describing rather than repeating the pitch. Deliberately shorter than the
 * AI section's full chat mock: one turn, three sources, no composer.
 */

const sources = [
  { Mark: GitHubColor, label: "PR #418" },
  { Mark: NotionColor, label: "Billing spec" },
  { Mark: LinearColor, label: "ENG-231" },
]

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-5" aria-hidden="true">
      <SynapseGlyph x={0} y={0} size={28} />
    </svg>
  )
}

export function FinalCta() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div
          {...reveal}
          className="border-line relative isolate overflow-hidden rounded-2xl border bg-white shadow-lift"
        >
          {/* One wash, cropped left so the answer card stays on clean paper */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-brand/10 absolute -top-28 -left-24 h-72 w-115 rounded-full blur-[100px]" />
          </div>

          <div className="grid items-center gap-10 px-6 py-10 sm:px-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-11 lg:py-12">
            {/* ── The ask ──────────────────────────────────────── */}
            <div>
              <Eyebrow>Get started</Eyebrow>

              <h2 className="text-ink mt-4 text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance sm:text-[30px]">
                Stop searching six tools for one answer.
              </h2>
              <p className="text-ink-soft mt-3.5 max-w-md text-[14.5px] leading-[1.65] text-pretty">
                Connect a source and ask Synapse about work your team did last
                month. That&rsquo;s the whole demo.
              </p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-11 w-full gap-2 rounded-lg px-6 text-[15px] font-medium shadow-rest sm:w-auto"
                  asChild
                >
                  <a href="/sign-up">
                    Start for free
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-line text-ink hover:bg-surface-1 h-11 w-full rounded-lg bg-white px-6 text-[15px] font-medium shadow-rest sm:w-auto"
                  asChild
                >
                  <a href="#pricing">Compare plans</a>
                </Button>
              </div>

              <p className="text-ink-faint mt-5 text-[13px]">
                Free plan, no card required · Connect your first tool in a minute
              </p>
            </div>

            {/* ── One answer, cited ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: 0.12, ease: EASE }}
              className="border-line overflow-hidden rounded-xl border bg-white shadow-rest"
            >
              <div className="border-line-soft bg-surface-1 flex items-center gap-2.5 border-b px-4 py-2.5">
                <Logo />
                <span className="text-ink text-[12.5px] font-medium">
                  Ask Synapse
                </span>
              </div>

              <div className="flex flex-col gap-3.5 p-4">
                <div className="flex justify-end">
                  <p className="bg-surface-1 border-line-soft text-ink max-w-[85%] rounded-xl rounded-br-sm border px-3 py-2 text-[12.5px] leading-[1.55]">
                    Why did we delay the billing migration?
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    <Logo />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink text-[12.5px] leading-[1.6]">
                      Proration for annual plans wasn&rsquo;t settled, so the
                      cutover moved to the next cycle — the spec and the ticket
                      were both updated the same day.
                    </p>

                    <div className="border-line-soft mt-3 border-t pt-2.5">
                      <span className="text-ink-faint text-[10px] font-semibold tracking-[0.1em] uppercase">
                        3 sources
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sources.map(({ Mark, label }) => (
                          <span
                            key={label}
                            className="border-line text-ink-soft inline-flex items-center gap-1.5 rounded-md border bg-white py-1 pr-2 pl-1.5 text-[11px] font-medium"
                          >
                            <Mark className="size-3.5" />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
