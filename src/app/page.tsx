import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthNavStatus } from "@/components/landing/auth-nav-status";
import { NavCtaSkeleton } from "@/components/landing/nav-cta-skeleton";

export const metadata: Metadata = {
  title: "Synapse — AI Workspace for Modern Teams",
};

export default function HomePage() {
  // The nav's Login/Open button depends on the session, which is only known
  // after a server read (cookie + DB). That read is wrapped in its own
  // Suspense boundary rather than awaited here — this keeps the rest of the
  // marketing page a static, edge-cacheable shell instead of making the whole
  // route render dynamically on every request just for one button.
  return (
    <LandingPage
      authSlotDesktop={
        <Suspense fallback={<NavCtaSkeleton layout="desktop" />}>
          <AuthNavStatus layout="desktop" />
        </Suspense>
      }
      authSlotMobile={
        <Suspense fallback={<NavCtaSkeleton layout="mobile" />}>
          <AuthNavStatus layout="mobile" />
        </Suspense>
      }
    />
  );
}
