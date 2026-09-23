import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getCachedSession } from "@/lib/session";
import { resolveDefaultWorkspaceSlug } from "@/lib/workspace-resolve";

export const metadata: Metadata = {
  title: "Synapse — AI Workspace for Modern Teams",
};

// The session check needs `headers()` to decide whether to redirect signed-in
// visitors into their workspace, which can't be prerendered — block instead of streaming.
export const instant = false;

/** The app's one slug-less entry point: sign-in, invites and settings land here. */
export default async function HomePage() {
  const session = await getCachedSession();
  if (session?.user) {
    const slug = await resolveDefaultWorkspaceSlug(session.user.id, session.user.name);
    redirect(`/${slug}/agent`);
  }

  return <LandingPage />;
}
