"use client"

import { motion } from "framer-motion"
import { ArrowRight, Check, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Section, Eyebrow, EASE, reveal } from "@/components/landing/section"
import {
  GitHubColor,
  SlackColor,
  NotionColor,
} from "@/components/landing/brand-logos"
import { SynapseGlyph } from "@/components/landing/illustrations"

const claims = [
  {
    title: "Grounded, not guessed",
    body: "Answers are assembled from your indexed content. If the source isn't there, Synapse says so instead of inventing it.",
  },
  {
    title: "Citations you can open",
    body: "Every response links back to the exact document, message or pull request it drew from.",
  },
  {
    title: "It can write back",
    body: "Turn a thread or a spec into tasks on the right project, with owners and due dates.",
  },
  {
    title: "Scoped to the workspace",
    body: "Retrieval respects project membership, so people only ever see what they already have access to.",
  },
]

function Logo() {
  return (
    <svg viewBox="0 0 28 28" className="size-5" aria-hidden="true">
      <SynapseGlyph x={0} y={0} size={28} />
    </svg>
  )
}

export function AiWorkspace() {
  return (
    <Section id="ai-workspace" divider>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        {/* ── Copy ─────────────────────────────────────────── */}
        <motion.div {...reveal}>
          <Eyebrow>Synapse AI</Eyebrow>
          <h2 className="text-ink mt-4 text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[34px] md:text-[40px]">
            An assistant that has actually read your work.
          </h2>
          <p className="text-ink-soft mt-4 text-[15px] leading-[1.65] md:text-base">
            Generic chatbots start from zero every time. Synapse starts from your
            repositories, documents, notes and threads — and shows its work.
          </p>

          <ul className="mt-8 flex flex-col gap-5">
            {claims.map(({ title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="border-brand-line bg-brand-wash mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border">
                  <Check className="text-brand size-3" strokeWidth={2.75} />
                </span>
                <div>
                  <p className="text-ink text-[14px] font-medium tracking-[-0.01em]">
                    {title}
                  </p>
                  <p className="text-ink-soft mt-1 text-[13.5px] leading-[1.6]">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Button
            className="mt-9 h-11 gap-2 rounded-lg px-5 text-[15px] font-medium shadow-rest"
            asChild
          >
            <a href="/sign-up">
              Try it on your workspace
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </motion.div>

        {/* ── Chat mock ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="relative"
        >
          <div className="border-line relative overflow-hidden rounded-xl border bg-white shadow-lift">
            {/* Header */}
            <div className="border-line-soft bg-surface-1 flex items-center gap-2.5 border-b px-4 py-3">
              <Logo />
              <span className="text-ink text-[13px] font-medium">
                Synapse AI
              </span>
              <span className="border-line text-ink-faint ml-auto flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Indexing live
              </span>
            </div>

            <div className="flex flex-col gap-5 p-4 sm:p-5">
              {/* User turn */}
              <div className="flex justify-end">
                <p className="bg-surface-1 border-line-soft text-ink max-w-[80%] rounded-xl rounded-br-sm border px-3.5 py-2.5 text-[13px] leading-[1.55]">
                  What changed in auth last sprint, and who reviewed it?
                </p>
              </div>

              {/* Assistant turn */}
              <div className="flex gap-2.5">
                <span className="mt-0.5 shrink-0">
                  <Logo />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-[13px] leading-[1.6]">
                    Auth moved from session cookies to short-lived tokens.
                    Three changes landed:
                  </p>
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {[
                      "GitHub OAuth provider added (PR #342)",
                      "Refresh-token middleware on all API routes",
                      "Session table dropped in migration 0041",
                    ].map((line) => (
                      <li
                        key={line}
                        className="text-ink-soft flex gap-2 text-[13px] leading-[1.55]"
                      >
                        <span className="bg-brand mt-1.75 size-1 shrink-0 rounded-full" />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <p className="text-ink-soft mt-2.5 text-[13px] leading-[1.6]">
                    Reviewed by Priya and Daniel. The rollout note is in the
                    platform wiki.
                  </p>

                  {/* Citations — real logos, because these are real sources */}
                  <div className="border-line-soft mt-3.5 border-t pt-3">
                    <span className="text-ink-faint text-[10px] font-semibold tracking-[0.1em] uppercase">
                      3 sources
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        { Mark: GitHubColor, label: "PR #342" },
                        { Mark: SlackColor, label: "#eng-platform" },
                        { Mark: NotionColor, label: "Platform wiki" },
                      ].map(({ Mark, label }) => (
                        <span
                          key={label}
                          className="border-line text-ink-soft hover:border-brand-line inline-flex items-center gap-1.5 rounded-md border bg-white py-1 pr-2 pl-1.5 text-[11px] font-medium transition-colors"
                        >
                          <Mark className="size-3.5" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Composer */}
              <div className="border-line-soft flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                <span className="text-ink-faint flex-1 truncate text-[13px]">
                  Create tasks for the rollout…
                </span>
                <span className="bg-brand flex size-6 shrink-0 items-center justify-center rounded-md text-white">
                  <ArrowUp className="size-3.5" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}
