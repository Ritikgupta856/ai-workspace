import { getCachedSession } from "@/lib/session"
import { NavCta } from "@/components/landing/nav-cta"

/**
 * Server-only: resolves the session (cookie + DB, no client round trip) and
 * hands the result to the client-side `NavCta`. Meant to be rendered inside a
 * `<Suspense>` boundary so the surrounding marketing page stays static while
 * this one slice streams in.
 */
export async function AuthNavStatus({
  layout,
}: {
  layout: "desktop" | "mobile"
}) {
  const session = await getCachedSession()
  return <NavCta isAuthenticated={Boolean(session?.user)} layout={layout} />
}
