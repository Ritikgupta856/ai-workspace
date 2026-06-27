"use client"

import { Navigation } from "@/components/landing/navigation"
import { Hero } from "@/components/landing/hero"
import { ProductPreview } from "@/components/landing/product-preview"
import { TrustedBy } from "@/components/landing/trusted-by"
import { Features } from "@/components/landing/features"
import { AiWorkspace } from "@/components/landing/ai-workspace"
import { Integrations } from "@/components/landing/integrations"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { FinalCta } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"


export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ "--background": "white" } as React.CSSProperties}>
      <Navigation />
      <main
        style={{
          backgroundImage: `
      radial-gradient(circle 900px at 50% -250px, rgba(59,130,246,0.14), transparent 65%),
      radial-gradient(circle 700px at 0% 250px, rgba(59,130,246,0.10), transparent 70%),
      radial-gradient(circle 700px at 100% 250px, rgba(59,130,246,0.10), transparent 70%),
      linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)
    `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <Hero />
        <ProductPreview />
        <TrustedBy />
        <Features />
        <AiWorkspace />
        <Integrations />
        <Testimonials />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
