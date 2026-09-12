import { cache } from "react"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"

/**
 * `auth.api.getSession` wrapped in React's request-scoped `cache`.
 *
 * Nothing about the session changes between calls within one render pass, so
 * a component that reads it twice (e.g. the landing nav's desktop and mobile
 * CTA, resolved independently under separate Suspense boundaries) shares one
 * DB read instead of issuing it twice.
 */
export const getCachedSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})
