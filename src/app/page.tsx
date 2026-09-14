import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getCachedSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Synapse — AI Workspace for Modern Teams",
};

export default async function HomePage() {
  const session = await getCachedSession();
  if (session?.user) redirect("/home");

  return <LandingPage />;
}
