import { Check } from "lucide-react"

import { UnderstandIllustration } from "@/components/landing/illustrations"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * Right-hand brand panel. Reuses the landing illustration and logo set rather
 * than inventing a second visual language for the auth screens.
 */

const points = [
  "Answers cited back to the exact document or thread",
  "Sources keep syncing after you connect them once",
  "Retrieval scoped to what each person can already see",
]

const LOGOS: BrandKey[] = ["github", "slack", "notion", "linear", "figma", "drive"]

export function AuthBrandPanel() {
  return (
    <aside className="border-line bg-surface-1 relative hidden w-1/2 shrink-0 overflow-hidden border-l lg:flex lg:flex-col lg:justify-center">
      {/* Texture and a single wash, both cropped so the panel stays calm */}
      <div className="pointer-events-none absolute inset-0">
        <div className="lp-dots lp-mask-radial absolute inset-0 opacity-70" />
        <div className="bg-brand/8 absolute -top-40 left-1/2 h-96 w-[560px] -translate-x-1/2 rounded-full blur-[110px]" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-12 py-16">
        {/* The product idea, drawn — same illustration as the landing page */}
        <div className="border-line rounded-xl border bg-white p-5 shadow-lift">
          <UnderstandIllustration className="h-auto w-full" />
        </div>

        <h2 className="text-ink mt-9 text-[24px] leading-[1.2] font-semibold tracking-[-0.025em] text-balance">
          Ask once. Answered from everything you&rsquo;ve connected.
        </h2>

        <ul className="mt-6 flex flex-col gap-3.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span className="border-brand-line bg-brand-wash mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border">
                <Check className="text-brand size-2.5" strokeWidth={3} />
              </span>
              <span className="text-ink-soft text-[13.5px] leading-[1.55]">
                {point}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-line-soft mt-9 border-t pt-6">
          <p className="text-ink-faint text-[11px] font-semibold tracking-[0.12em] uppercase">
            Connects to
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {LOGOS.map((key) => {
              const { name, Color } = BRANDS[key]
              return (
                <span
                  key={key}
                  className="text-ink-soft flex items-center gap-1.5 text-[12.5px] font-medium"
                  title={name}
                >
                  <Color className="size-4 shrink-0" />
                  {name}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
