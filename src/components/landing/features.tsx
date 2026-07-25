"use client"

import { motion } from "framer-motion"
import {
  Sparkles,
  FolderKanban,
  ListChecks,
  BookOpen,
  FileText,
  Plug,
  Search,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Section, SectionHeading, EASE } from "@/components/landing/section"

/**
 * Bento grid. Icons are monochrome by default — the brand hue is reserved for
 * the one card we want read first. A rainbow of per-card colours is the fastest
 * way to make a page look generated, so the palette stays locked.
 */

type Feature = {
  icon: LucideIcon
  title: string
  body: string
  span: string
  /** Only the lead card gets the accent treatment. */
  lead?: boolean
  visual?: "answer" | "search"
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "An assistant with your context loaded",
    body: "Ask in plain language. Synapse retrieves from the projects, documents and threads it has indexed, then answers with the sources attached.",
    span: "md:col-span-4",
    lead: true,
    visual: "answer",
  },
  {
    icon: Search,
    title: "One search across everything",
    body: "Projects, tasks, notes, documents and chat history behind a single ⌘K.",
    span: "md:col-span-2",
    visual: "search",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    body: "Milestones, owners and health in one view, so status meetings get shorter.",
    span: "md:col-span-2",
  },
  {
    icon: ListChecks,
    title: "Tasks",
    body: "Board, list and calendar views over the same tasks. Drag to reprioritise.",
    span: "md:col-span-2",
  },
  {
    icon: FileText,
    title: "Documents",
    body: "Upload specs and PDFs. They're parsed, chunked and searchable in seconds.",
    span: "md:col-span-2",
  },
  {
    icon: BookOpen,
    title: "Notes and knowledge",
    body: "Write decisions down once. Every future answer can cite them instead of guessing.",
    span: "md:col-span-3",
  },
  {
    icon: Plug,
    title: "Integrations that sync both ways",
    body: "Pull work in from GitHub, Slack, Notion and Linear — and push tasks back out.",
    span: "md:col-span-3",
  },
]

/* ── Inline visuals: small, literal, drawn to the same grid ── */

function AnswerVisual() {
  return (
    <div className="border-line-soft bg-surface-1/60 mt-6 rounded-lg border p-3">
      <div className="border-line-soft flex items-center gap-2 rounded-md border bg-white px-2.5 py-2">
        <Search className="text-ink-faint size-3.5 shrink-0" strokeWidth={2.25} />
        <span className="text-ink-soft truncate text-[12px]">
          Why did we drop the queue worker?
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <span className="bg-brand mt-1.5 h-11 w-[2px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="bg-line h-[3px] w-full rounded-full" />
          <div className="bg-line mt-2 h-[3px] w-[86%] rounded-full" />
          <div className="bg-line mt-2 h-[3px] w-[62%] rounded-full" />
          <div className="mt-3 flex items-center gap-1.5">
            <span className="border-brand-line bg-brand-wash text-brand-ink rounded border px-1.5 py-0.5 text-[10px] font-medium">
              ADR-014
            </span>
            <span className="border-line text-ink-faint rounded border px-1.5 py-0.5 text-[10px] font-medium">
              PR #291
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchVisual() {
  const rows = [
    { label: "Tasks", w: "w-[58%]" },
    { label: "Docs", w: "w-[74%]" },
    { label: "Notes", w: "w-[44%]" },
  ]
  return (
    <div className="border-line-soft mt-6 divide-y divide-line-soft rounded-lg border bg-white">
      {rows.map(({ label, w }) => (
        <div key={label} className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="text-ink-faint w-9 shrink-0 text-[10px] font-medium tracking-[0.06em] uppercase">
            {label}
          </span>
          <span className={cn("bg-line h-[3px] rounded-full", w)} />
        </div>
      ))}
    </div>
  )
}

export function Features() {
  return (
    <Section id="features" divider>
      <SectionHeading
        eyebrow="The workspace"
        title="Everything your team already does — in one place that understands it."
        lede="Synapse isn't another silo. It indexes the work you're doing so the assistant, the search bar and the board are all looking at the same thing."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 md:grid-cols-6">
        {features.map(({ icon: Icon, title, body, span, lead, visual }, i) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: i * 0.04, ease: EASE }}
            className={cn(
              "lp-surface lp-lift group flex flex-col rounded-xl p-6",
              span,
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border",
                lead
                  ? "border-brand-line bg-brand-wash text-brand"
                  : "border-line-soft bg-surface-1 text-ink-soft",
              )}
            >
              <Icon className="size-[17px]" strokeWidth={1.9} />
            </span>

            <h3 className="text-ink mt-5 text-[15px] leading-snug font-semibold tracking-[-0.015em]">
              {title}
            </h3>
            <p className="text-ink-soft mt-2 text-[13.5px] leading-[1.6]">
              {body}
            </p>

            {visual === "answer" && <AnswerVisual />}
            {visual === "search" && <SearchVisual />}
          </motion.article>
        ))}
      </div>
    </Section>
  )
}
