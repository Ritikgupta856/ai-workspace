"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

/**
 * The nav's auth-dependent buttons, split out of `Navigation` so the
 * `isAuthenticated` value can arrive as a resolved server prop (via
 * `AuthNavStatus`) instead of `useSession()`'s own client-side fetch — that
 * fetch used to leave this whole area blank for a beat on every load.
 */
export function NavCta({
  isAuthenticated,
  layout,
}: {
  isAuthenticated: boolean
  layout: "desktop" | "mobile"
}) {
  const router = useRouter()

  function handleLogout() {
    signOut().then(() => {
      router.push("/")
    })
  }

  if (layout === "mobile") {
    return isAuthenticated ? (
      <>
        <Button asChild className="justify-start">
          <a href="/home">Open</a>
        </Button>
        <Button variant="ghost" className="justify-start" onClick={handleLogout}>
          Logout
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" asChild className="justify-start">
          <a href="/sign-in">Login</a>
        </Button>
        <Button asChild>
          <a href="/sign-up">Get Started</a>
        </Button>
      </>
    )
  }

  return isAuthenticated ? (
    <>
      <Button variant="ghost" asChild>
        <a href="/home">Open</a>
      </Button>
      <Button onClick={handleLogout}>Logout</Button>
    </>
  ) : (
    <>
      <Button variant="ghost" asChild>
        <a href="/sign-in">Login</a>
      </Button>
      <Button asChild>
        <a href="/sign-up">Get Started</a>
      </Button>
    </>
  )
}
