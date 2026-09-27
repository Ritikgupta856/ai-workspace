import Image from "next/image"
import NextLink from "next/link"
import { ArrowLeft } from "lucide-react"

import { Footer } from "@/components/landing/footer"

/** Shell for plain-language policy pages: slim header, one readable column, the site footer. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <div className="lp-force-light bg-background text-foreground min-h-screen">
      <header className="border-line-soft sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <NextLink href="/" aria-label="Synapse home" className="inline-flex items-center">
            <Image src="/images/synapse-logo.svg" alt="Synapse" width={120} height={40} className="h-5 w-auto" />
          </NextLink>
          <NextLink
            href="/"
            className="text-ink-soft hover:text-ink inline-flex items-center gap-1.5 text-[13.5px] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </NextLink>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pt-16 pb-24 sm:px-6 md:pt-24">
        <p className="text-ink-faint text-[11px] font-semibold tracking-[0.18em] uppercase">Legal</p>
        <h1 className="text-ink mt-3 text-[36px] leading-[1.1] font-semibold tracking-[-0.03em] md:text-[44px]">
          {title}
        </h1>
        <p className="text-ink-faint mt-3 text-[13px]">Last updated {updated}</p>
        <p className="text-ink-soft mt-8 text-[16px] leading-[1.7]">{intro}</p>
        <div className="mt-12 flex flex-col gap-10">{children}</div>
      </main>

      <Footer />
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-ink text-[19px] font-semibold tracking-[-0.015em]">{title}</h2>
      <div className="text-ink-soft mt-3 flex flex-col gap-3 text-[15px] leading-[1.7] [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_strong]:font-medium [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </section>
  )
}
