import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Synapse — AI Workspace for Modern Teams",
};

export default function HomePage() {
  return <LandingPage />;
}
