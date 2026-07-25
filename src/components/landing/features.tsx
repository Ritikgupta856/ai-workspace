"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  FolderKanban,
  ListChecks,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, SectionHeading, EASE } from "@/components/landing/section"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * One card shape, repeated. The previous bento grid gave every card a different
 * width and two of them inline illustrations, which made the section read as
 * seven unrelated things; a uniform grid lets the copy do the work.
 *
 * Interaction is a cursor-tracked wash rather than per-card animation — it
 * responds to the pointer without anything moving on the page.
 */

type Feature = {
  icon: LucideIcon
  title: string
  body: string
  href: string
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "An assistant with your context loaded",
    body: "Ask in plain language. Synapse retrieves from the projects, documents and threads it has indexed, then answers with the sources attached.",
    href: "#ai-workspace",
  },
  {
    icon: Search,
    title: "One search across everything",
    body: "Projects, tasks, notes, documents and chat history behind a single ⌘K.",
    href: "#ai-workspace",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    body: "Milestones, owners and health in one view, so status meetings get shorter.",
    href: "#how-it-works",
  },
  {
    icon: ListChecks,
    title: "Tasks",
    body: "Board, list and calendar views over the same tasks. Drag to reprioritise.",
    href: "#how-it-works",
  },
  {
    icon: FileText,
    title: "Documents",
    body: "Upload specs and PDFs. They're parsed, chunked and searchable in seconds.",
    href: "#how-it-works",
  },
  {
    icon: BookOpen,
    title: "Notes and knowledge",
    body: "Write decisions down once. Every future answer can cite them instead of guessing.",
    href: "#how-it-works",
  },
]

const LOGOS: BrandKey[] = ["github", "slack", "notion", "linear", "figma", "drive"]

/** Writes the pointer position onto the card so CSS can place the wash. */
function trackPointer(event: React.MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`)
}

const spotlight = {
  background:
    "radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), var(--lp-accent-wash), transparent 70%)",
} as const

export function Features() {
  return (
    <Section id="features" divider>
      <SectionHeading
        eyebrow="The workspace"
        title="Everything your team already does — in one place that understands it."
        lede="Synapse isn't another silo. It indexes the work you're doing so the assistant, the search bar and the board are all looking at the same thing."
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body, href }, i) => (
          <motion.a
            key={title}
            href={href}
            onMouseMove={trackPointer}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
            className="lp-surface lp-lift group relative isolate flex flex-col overflow-hidden rounded-xl p-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={spotlight}
            />

            <div className="flex items-start justify-between gap-3">
              <span className="border-line-soft bg-surface-1 text-ink-soft group-hover:border-brand-line group-hover:bg-brand-wash group-hover:text-brand flex size-9 items-center justify-center rounded-lg border transition-colors duration-300">
                <Icon className="size-4.25" strokeWidth={1.9} />
              </span>
              <ArrowUpRight className="text-ink-faint size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </div>

            <h3 className="text-ink mt-5 text-[15px] leading-snug font-semibold tracking-[-0.015em]">
              {title}
            </h3>
            <p className="text-ink-soft mt-2 text-[13.5px] leading-[1.6]">
              {body}
            </p>
          </motion.a>
        ))}
      </div>

      {/* Integrations get the full width — the logos are the argument */}
      <motion.a
        href="#integrations"
        onMouseMove={trackPointer}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        className="lp-surface lp-lift group relative isolate mt-4 flex flex-col gap-6 overflow-hidden rounded-xl p-6 md:flex-row md:items-center md:justify-between"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={spotlight}
        />

        <div className="max-w-md">
          <h3 className="text-ink text-[15px] leading-snug font-semibold tracking-[-0.015em]">
            Integrations that sync both ways
          </h3>
          <p className="text-ink-soft mt-2 text-[13.5px] leading-[1.6]">
            Pull work in from GitHub, Slack, Notion and Linear — and push tasks
            back out.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {LOGOS.map((key) => {
            const { name, Color } = BRANDS[key]
            return (
              <span
                key={key}
                title={name}
                className={cn(
                  "border-line flex size-10 items-center justify-center rounded-xl border bg-white shadow-rest",
                  "transition-transform duration-300 group-hover:-translate-y-0.5"
                )}
              >
                <Color className="size-4.5" />
                <span className="sr-only">{name}</span>
              </span>
            )
          })}
        </div>
      </motion.a>
    </Section>
  )
}
