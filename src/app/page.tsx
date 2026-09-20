import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getCachedSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Synapse — AI Workspace for Modern Teams",
};

// The session check needs `headers()` to decide whether to redirect signed-in
// visitors to /agent, which can't be prerendered — block instead of streaming.
export const instant = false;

export default async function HomePage() {
  const session = await getCachedSession();
  if (session?.user) redirect("/agent");

  return <LandingPage />;
}
