import Image from "next/image"
import {
  Code2,
  FileText,
  Folder,
  Lock,
  MessageSquare,
  Plus,
  Puzzle,
  type LucideIcon,
} from "lucide-react"

import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * Right-hand brand panel: one sentence about the product, then the idea drawn
 * as a hub — every kind of work a team produces, feeding one place you can ask.
 *
 * The diagram is a fixed 7:4 box so the dashed connectors (SVG, one coordinate
 * space) and the cards (HTML, positioned by percentage) stay aligned at every
 * panel width without measuring anything at runtime.
 */

type Node = {
  title: string
  caption: string
  Icon: LucideIcon
  /** Icon tile tint. */
  tone: string
  /** Card centre, as a percentage of the diagram box. */
  at: string
}

const NODES: Node[] = [
  {
    title: "Documents",
    caption: "Search across your docs",
    Icon: FileText,
    tone: "bg-blue-50 text-blue-600",
    at: "left-1/2 top-[11%]",
  },
  {
    title: "Code",
    caption: "Understand your codebase",
    Icon: Code2,
    tone: "bg-violet-50 text-violet-600",
    at: "left-[17%] top-[38%]",
  },
  {
    title: "Conversations",
    caption: "Find in team discussions",
    Icon: MessageSquare,
    tone: "bg-emerald-50 text-emerald-600",
    at: "left-[83%] top-[38%]",
  },
  {
    title: "Projects",
    caption: "Context from your work",
    Icon: Folder,
    tone: "bg-amber-50 text-amber-600",
    at: "left-[22%] top-[82%]",
  },
  {
    title: "Integrations",
    caption: "All your tools, connected",
    Icon: Puzzle,
    tone: "bg-rose-50 text-rose-500",
    at: "left-[78%] top-[82%]",
  },
]

const LOGOS: BrandKey[] = ["github", "slack", "notion", "linear", "figma", "drive"]

/* Hub sits at (350, 204) in the 700×400 diagram space; each path leaves its
   edge and stops just short of a card, which covers the last few pixels. */
const CONNECTORS = [
  "M350 158C344 132 354 104 349 78",
  "M310 188C272 176 236 172 196 164",
  "M390 188C428 176 464 172 504 164",
  "M316 226C280 250 244 276 208 300",
  "M384 226C420 250 456 276 492 300",
]

export function AuthBrandPanel() {
  return (
    <aside className="border-line relative hidden w-1/2 shrink-0 overflow-hidden border-l bg-gradient-to-b from-white via-[#fafbff] to-[#f2f4fb] lg:flex lg:flex-col lg:justify-center">
      {/* A single wash, centred behind the hub so the diagram sits in light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-brand/8 absolute top-1/2 left-1/2 h-[520px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[600px] px-10 py-14 xl:px-14">
        <h2 className="text-ink text-[28px] leading-[1.2] font-semibold tracking-[-0.03em] text-balance xl:text-[30px]">
          One workspace.
          <br />
          All your team&rsquo;s knowledge.
        </h2>
        <p className="text-ink-soft mt-4 max-w-[400px] text-[15px] leading-[1.6]">
          Search, ask, and discover answers from everything your team connects.
        </p>

        {/* ── The hub ─────────────────────────────────────────── */}

        <div className="relative mt-10 aspect-[7/4] w-full">
          <svg
            viewBox="0 0 700 400"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Documents, code, conversations, projects and integrations all connecting into one Synapse workspace"
          >
            {/* Orbit rings — the hub's own space, not decoration */}
            <g
              fill="none"
              stroke="var(--lp-line-soft)"
              strokeWidth={1}
              transform="translate(350 204)"
            >
              <circle r={92} />
              <circle r={134} strokeOpacity={0.7} />
            </g>

            <g
              fill="none"
              stroke="var(--lp-accent-line)"
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeDasharray="3 6"
            >
              {CONNECTORS.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
          </svg>

          {/* Centre: Synapse itself */}
          <div className="border-line absolute top-[51%] left-1/2 flex size-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border bg-white shadow-lift">
            <Image
              src="/images/synapse-mark.svg"
              alt=""
              width={32}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </div>

          {NODES.map(({ title, caption, Icon, tone, at }) => (
            <div
              key={title}
              className={`border-line absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-xl border bg-white py-2.5 pr-4 pl-2.5 whitespace-nowrap shadow-lift ${at}`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-ink text-[12.5px] leading-none font-semibold tracking-[-0.01em]">
                  {title}
                </span>
                <span className="text-ink-faint text-[11px] leading-none">
                  {caption}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* ── Sources ─────────────────────────────────────────── */}

        <div className="mt-10 flex items-center gap-3" role="separator">
          <span className="bg-line-soft h-px flex-1" />
          <span className="text-ink-faint text-[10.5px] font-semibold tracking-[0.14em] uppercase">
            Connected to
          </span>
          <span className="bg-line-soft h-px flex-1" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {LOGOS.map((key) => {
            const { name, Color } = BRANDS[key]
            return (
              <span
                key={key}
                title={name}
                className="border-line flex size-11 items-center justify-center rounded-xl border bg-white shadow-rest"
              >
                <Color className="size-5" />
                <span className="sr-only">{name}</span>
              </span>
            )
          })}
          <span
            aria-hidden
            className="border-line text-ink-faint flex size-11 items-center justify-center rounded-xl border border-dashed bg-white/60"
          >
            <Plus className="size-4" />
          </span>
        </div>

        <p className="text-ink-faint mt-7 flex items-center justify-center gap-2 text-[12.5px]">
          <Lock className="size-3.5" strokeWidth={2} />
          Your data stays private and secure.
        </p>
      </div>
    </aside>
  )
}
