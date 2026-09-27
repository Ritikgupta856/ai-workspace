"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check, FileText, Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Section, Eyebrow, EASE, reveal } from "@/components/landing/section"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * Six capabilities, one card shape. Each card pairs its copy with a small
 * piece of the product it describes, drawn from what the app actually stores
 * — task statuses, document processing states, integration syncs. An earlier
 * bento mixed card widths and only illustrated two of them, which read as
 * seven unrelated things; here every card has the same frame and the same
 * visual language, so the grid reads as one product.
 *
 * Hover keeps the cursor-tracked wash; the only motion inside a card is the
 * one thing that would move in the product.
 */

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

/* ── Visuals ────────────────────────────────────────────────── */

function Key({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "border-line text-ink flex h-12 items-center justify-center rounded-xl border bg-white text-[17px] font-medium",
        "shadow-[0_2px_0_var(--lp-line),0_8px_16px_-8px_oklch(0.21_0.02_255/0.2)] transition-all duration-200",
        "group-hover:translate-y-0.5 group-hover:shadow-[0_0_0_var(--lp-line),0_4px_10px_-6px_oklch(0.21_0.02_255/0.2)]",
        className,
      )}
    >
      {children}
    </span>
  )
}

function SearchVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="flex items-center gap-2">
        <Key className="w-14">⌘</Key>
        <Key className="w-12">K</Key>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {["Tasks", "Pages", "Docs", "Chats"].map((kind) => (
          <span
            key={kind}
            className="border-line-soft text-ink-soft rounded-full border bg-white px-2 py-0.5 text-[11px]"
          >
            {kind}
          </span>
        ))}
      </div>
    </div>
  )
}

function DocumentsVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {/* Mirrors DocumentProcessingStatus: COMPLETED · PROCESSING · PENDING */}
      <div className="border-line-soft flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 shadow-rest">
        <FileText className="size-3.5 shrink-0 text-rose-500" />
        <span className="text-ink flex-1 truncate text-[12px]">product-spec.pdf</span>
        <span className="flex items-center gap-1 text-[11px] text-emerald-600">
          <Check className="size-3" strokeWidth={2.75} />
          Indexed
        </span>
      </div>

      <div className="border-brand-line rounded-lg border bg-white px-3 py-2 shadow-rest">
        <div className="flex items-center gap-2.5">
          <FileText className="size-3.5 shrink-0 text-rose-500" />
          <span className="text-ink flex-1 truncate text-[12px]">architecture.pdf</span>
          <span className="text-brand-ink flex items-center gap-1 text-[11px]">
            <Loader2 className="size-3 animate-spin motion-reduce:animate-none" strokeWidth={2.75} />
            Chunking
          </span>
        </div>
        <div className="bg-surface-1 mt-2 h-1 overflow-hidden rounded-full">
          <motion.div
            className="bg-brand h-full rounded-full"
            initial={{ width: "8%" }}
            whileInView={{ width: "68%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
          />
        </div>
      </div>

      <div className="border-line-soft flex items-center gap-2.5 rounded-lg border bg-white/60 px-3 py-2">
        <FileText className="text-ink-faint size-3.5 shrink-0" />
        <span className="text-ink-soft flex-1 truncate text-[12px]">meeting-notes.md</span>
        <span className="text-ink-faint text-[11px]">Queued</span>
      </div>
    </div>
  )
}

/** Card counts per column; one card in review is the one Synapse wrote. */
const BOARD = [
  { label: "Todo", cards: 3 },
  { label: "In progress", cards: 2 },
  { label: "In review", cards: 1 },
  { label: "Done", cards: 3 },
]

function BoardVisual() {
  return (
    <div className="grid h-full grid-cols-4 gap-1.5 pt-1">
      {BOARD.map(({ label, cards }, col) => (
        <div key={label} className="bg-surface-1 flex flex-col gap-1.5 rounded-lg p-1.5">
          <span className="text-ink-faint truncate px-0.5 text-[9.5px] font-medium">{label}</span>
          {Array.from({ length: cards }, (_, i) => {
            const aiCard = col === 2
            return (
              <span
                key={i}
                className={cn(
                  "flex flex-col gap-1 rounded-md border bg-white p-1.5 transition-transform duration-300",
                  aiCard
                    ? "border-brand-line shadow-rest group-hover:-translate-y-0.5"
                    : "border-line-soft",
                  col === 3 && "opacity-60",
                )}
              >
                <span className="bg-line h-1 w-4/5 rounded-full" />
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      (col + i) % 3 === 0 ? "bg-rose-400" : (col + i) % 3 === 1 ? "bg-amber-400" : "bg-sky-400",
                    )}
                  />
                  <span className="bg-line-soft h-1 w-1/3 rounded-full" />
                  {aiCard && <Sparkles className="text-brand ml-auto size-2.5" />}
                </span>
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function WriteBackVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      {/* A second card peeking out behind: it wrote more than one. */}
      <div className="border-line-soft absolute inset-x-8 top-1/2 h-24 -translate-y-[38%] rounded-xl border bg-white/70" />
      <div className="border-line relative w-full max-w-68 rounded-xl border bg-white p-3.5 shadow-lift transition-transform duration-300 group-hover:-translate-y-1">
        <span className="text-brand-ink flex items-center gap-1.5 text-[10.5px] font-medium">
          <Sparkles className="size-3" />
          Generated from AUTH-118
        </span>
        <p className="text-ink mt-2 text-[13px] leading-snug font-medium">
          Roll out token refresh to the mobile app
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-medium text-rose-600">
            <span className="size-1.5 rounded-full bg-rose-500" />
            High
          </span>
          <span className="border-line-soft text-ink-soft rounded-md border px-1.5 py-0.5 text-[10.5px]">
            Due Fri
          </span>
          <span className="bg-brand ml-auto flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-white">
            PK
          </span>
        </div>
      </div>
    </div>
  )
}

function PagesVisual() {
  return (
    <div className="h-full pt-1 mask-[linear-gradient(to_bottom,#000_75%,transparent)]">
      <div className="border-line-soft h-full rounded-t-xl border border-b-0 bg-white px-4 pt-3.5 shadow-rest">
        <p className="text-ink text-[13px] font-semibold tracking-[-0.01em]">Auth rollout</p>
        <p className="text-ink-faint mt-0.5 text-[10.5px]">Platform · Decision</p>
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="bg-line-soft h-1.5 w-full rounded-full" />
          <span className="bg-line-soft h-1.5 w-11/12 rounded-full" />
        </div>
        <p className="text-ink mt-2.5 text-[12px] leading-[1.55]">
          <span className="bg-brand-wash decoration-brand-line rounded-sm px-0.5 underline decoration-2 underline-offset-2">
            Access tokens now expire after 15 minutes.
          </span>
          <span className="bg-brand-wash text-brand-ink border-brand-line ml-1 inline-flex size-4 -translate-y-px items-center justify-center rounded border align-middle text-[9.5px] font-semibold">
            4
          </span>
        </p>
        <div className="mt-2.5 flex flex-col gap-1.5">
          <span className="bg-line-soft h-1.5 w-10/12 rounded-full" />
          <span className="bg-line-soft h-1.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Recent sync history per source, oldest first. 0 is a missed run. */
const SYNCS: { key: BrandKey; history: number[]; status: string; syncing?: boolean }[] = [
  { key: "github", history: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], status: "2m ago" },
  { key: "linear", history: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], status: "5m ago" },
  { key: "notion", history: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], status: "Syncing", syncing: true },
  { key: "figma", history: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], status: "1h ago" },
]

function SyncVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {SYNCS.map(({ key, history, status, syncing }) => {
        const { name, Color } = BRANDS[key]
        return (
          <div key={key} className="flex items-center gap-2.5">
            <span className="border-line-soft flex size-6 shrink-0 items-center justify-center rounded-md border bg-white">
              <Color className="size-3.5" />
            </span>
            <span className="text-ink w-12 shrink-0 truncate text-[11.5px]">{name}</span>
            <span className="flex flex-1 items-center justify-between gap-0.5">
              {history.map((ok, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-4 w-full max-w-1 rounded-full",
                    ok ? "bg-emerald-500/75" : "bg-line",
                    syncing && i === history.length - 1 && "bg-brand animate-pulse motion-reduce:animate-none",
                  )}
                />
              ))}
            </span>
            <span
              className={cn(
                "w-12 shrink-0 text-right text-[10.5px] tabular-nums",
                syncing ? "text-brand-ink" : "text-ink-faint",
              )}
            >
              {status}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Section ───────────────────────────────────────────────── */

const blocks: { title: string; body: string; Visual: () => React.JSX.Element }[] = [
  {
    title: "One search across everything",
    body: "Projects, tasks, pages, documents and chat history behind a single ⌘K.",
    Visual: SearchVisual,
  },
  {
    title: "Documents, parsed for answers",
    body: "Upload specs and PDFs. They're parsed, chunked and searchable in seconds.",
    Visual: DocumentsVisual,
  },
  {
    title: "A board for every project",
    body: "Plan across Todo to Done, drag to reprioritise, and see who owns what.",
    Visual: BoardVisual,
  },
  {
    title: "Answers that become tasks",
    body: "Turn a thread or a spec into tasks with owners, priorities and due dates — tagged with where they came from.",
    Visual: WriteBackVisual,
  },
  {
    title: "Pages your answers can cite",
    body: "Write decisions down once. Every future answer can cite them instead of guessing.",
    Visual: PagesVisual,
  },
  {
    title: "Always in sync",
    body: "Connected tools sync in the background, so answers reflect this week's work, not last month's.",
    Visual: SyncVisual,
  },
]

export function Features() {
  return (
    <Section id="features" divider>
      <motion.div
        {...reveal}
        className="grid items-end gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16"
      >
        <div>
          <Eyebrow>The workspace</Eyebrow>
          <h2 className="text-ink mt-3 text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] text-pretty sm:text-[34px] md:text-[40px]">
            Everything your team already does — in one place that understands it.
          </h2>
        </div>
        <p className="text-ink-soft text-[15px] leading-[1.65] md:text-base">
          Synapse isn&apos;t another silo. It indexes the work you&apos;re doing
          so the assistant, the search bar and the board are all looking at the
          same thing.
        </p>
      </motion.div>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
        {blocks.map(({ title, body, Visual }, i) => (
          <motion.div
            key={title}
            onMouseMove={trackPointer}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: EASE }}
            className="lp-surface lp-lift group relative isolate flex flex-col overflow-hidden rounded-2xl"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={spotlight}
            />

            <div className="p-6 pb-0">
              <h3 className="text-ink text-[15px] leading-snug font-semibold tracking-[-0.015em]">
                {title}
              </h3>
              <p className="text-ink-soft mt-2 text-[13.5px] leading-[1.6]">{body}</p>
            </div>

            <div className="mt-auto pt-6">
              <div className="border-line-soft mx-6 border-t border-dashed" />
              <div aria-hidden className="h-48 px-6 pt-5 pb-6">
                <Visual />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
