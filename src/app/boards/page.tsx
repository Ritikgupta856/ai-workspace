import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { redirectIntoWorkspace } from "@/lib/workspace-resolve"

export const instant = false

/** Bare, slug-less link — forward into the current workspace. */
export default async function BoardsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  await redirectIntoWorkspace(session.user.id, session.user.name, "boards", await searchParams)
}
