"use client"

import Image from "next/image"
import NextLink from "next/link"

/**
 * Footer. The Product column points at real anchors on this page; everything
 * marked `soon` renders as plain text rather than a link, so nothing here
 * promises a page that doesn't exist yet.
 */

type Link = { label: string; href?: string }

const columns: { heading: string; links: Link[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Synapse AI", href: "#ai-workspace" },
      { label: "Integrations", href: "#integrations" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Create an account", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Open workspace", href: "/home" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About" },
      { label: "Contact", href: "mailto:hello@synapse.so" },
      { label: "Privacy" },
      { label: "Terms" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-white to-[#f4f6fb]">
      <div className="lp-rule absolute inset-x-0 top-0" />

      <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ── Brand ────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <NextLink
              href="/"
              className="inline-flex items-center"
              aria-label="Synapse home"
            >
              <Image
                src="/images/synapse-logo.svg"
                alt="Synapse"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </NextLink>

            <p className="text-ink-soft mt-4 max-w-xs text-[13.5px] leading-[1.65]">
              One workspace that reads your projects, docs and repositories — so
              the answer is already there when someone asks.
            </p>

          </div>

          {/* ── Link columns ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {columns.map(({ heading, links }) => (
              <div key={heading}>
                <h3 className="text-ink-faint text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {heading}
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      {href ? (
                        <a
                          href={href}
                          className="text-ink-soft hover:text-ink text-[13.5px] underline-offset-4 transition-colors duration-200 hover:underline"
                        >
                          {label}
                        </a>
                      ) : (
                        <span className="text-ink-faint inline-flex items-center gap-1.5 text-[13.5px]">
                          {label}
                          <span className="border-line rounded border px-1 py-px text-[9px] font-medium tracking-[0.06em] uppercase">
                            Soon
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="border-line-soft mt-14 flex flex-col items-center justify-center gap-3 border-t pt-7 text-center sm:flex-row sm:text-left">
          <p className="text-ink-faint text-[12.5px]">
            &copy; {new Date().getFullYear()} Synapse. All rights reserved.
          </p>
         
        </div>
      </div>
    </footer>
  )
}
