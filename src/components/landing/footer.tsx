"use client"

import Image from "next/image"
import NextLink from "next/link"
import { useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import { ArrowRight, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EASE } from "@/components/landing/section"
import { BRANDS, type BrandKey } from "@/components/landing/brand-logos"

/**
 * Footer: a closing call to action, then link columns where every link goes
 * somewhere real — page sections, the four live integrations, auth pages and
 * the legal pages. Section links are root-relative ("/#pricing") so the same
 * footer works on the legal pages too.
 */

type FooterLink = { label: string; href: string; brand?: BrandKey }

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Product tour", href: "/#tour" },
      { label: "Synapse AI", href: "/#ai-workspace" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Integrations",
    links: (["github", "notion", "linear", "figma"] as const).map((key) => ({
      label: BRANDS[key].name,
      href: "/#integrations",
      brand: key,
    })),
  },
  {
    heading: "Account",
    links: [
      { label: "Create an account", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Reset password", href: "/forgot-password" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

/** Faint grid for the dark panel, masked so it fades out from the centre. */
const panelGrid = {
  backgroundImage:
    "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
  maskImage: "radial-gradient(60% 70% at 50% 0%, #000 0%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(60% 70% at 50% 0%, #000 0%, transparent 100%)",
} as const

const noSubscription = () => () => {}

/** The current year, read in the browser only, so prerendered pages never freeze it at build time. */
function useYear() {
  return useSyncExternalStore(noSubscription, () => new Date().getFullYear(), () => null)
}

export function Footer() {
  const year = useYear()

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f6fb]">
      <div className="lp-rule absolute inset-x-0 top-0" />

      <div className="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-6 lg:px-8">
        {/* ── Closing call to action ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="bg-ink relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center shadow-[0_40px_100px_-40px_oklch(0.55_0.21_258/0.6)] sm:px-12 sm:py-20"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={panelGrid} />
          <div
            aria-hidden
            className="bg-brand/40 pointer-events-none absolute -top-56 left-1/2 -z-10 size-[34rem] -translate-x-1/2 rounded-full blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />

          <h2 className="mx-auto max-w-2xl text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-white sm:text-[46px] md:text-[54px]">
            Stop searching. Start asking.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.65] text-white/65 md:text-base">
            Free for teams of three. Connect your first tool and ask your first
            question in about a minute.
          </p>

          <div className="mt-9 flex items-center justify-center gap-2.5 sm:gap-3">
            <Button
              className="h-12 gap-2 rounded-xl px-5 text-[14px] font-medium shadow-[0_10px_30px_-10px_oklch(0.55_0.21_258/0.9)] sm:px-7 sm:text-[15px]"
              asChild
            >
              <NextLink href="/sign-up">
                Start for free
                <ArrowRight className="size-4" />
              </NextLink>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl border-white/15 bg-white/5 px-5 text-[14px] font-medium text-white hover:bg-white/10 hover:text-white sm:px-7 sm:text-[15px]"
              asChild
            >
              <NextLink href="/sign-in">Sign in</NextLink>
            </Button>
          </div>
        </motion.div>

        {/* ── Links ──────────────────────────────────────────── */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <NextLink href="/" className="inline-flex items-center" aria-label="Synapse home">
              <Image
                src="/images/synapse-logo.svg"
                alt="Synapse"
                width={120}
                height={40}
                className="h-5.5 w-auto"
              />
            </NextLink>
            <p className="text-ink-soft mt-4 max-w-xs text-[13.5px] leading-[1.65]">
              One workspace that reads your projects, docs and repositories — so
              the answer is already there when someone asks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {columns.map(({ heading, links }) => (
              <div key={heading}>
                <h3 className="text-ink text-[13px] font-semibold">{heading}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {links.map(({ label, href, brand }) => {
                    const Mark = brand ? BRANDS[brand].Mono : null
                    return (
                      <li key={label}>
                        <NextLink
                          href={href}
                          className="text-ink-soft hover:text-ink inline-flex items-center gap-2 text-[13.5px] transition-colors duration-200"
                        >
                          {Mark && <Mark className="size-3.5 shrink-0" />}
                          {label}
                        </NextLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="border-line-soft mt-16 flex flex-col-reverse items-center gap-4 border-t py-7 sm:flex-row sm:justify-between">
          <p className="text-ink-faint text-[12.5px]">
            &copy; {year} Synapse. All rights reserved.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-ink-faint hover:text-ink inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
          >
            Back to top
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
