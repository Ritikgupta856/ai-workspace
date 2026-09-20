import type { Metadata } from "next"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { ChatLayout } from "@/components/chat/chat-layout"

// Reads the session (headers) on every request, so it can't be prerendered.
export const instant = false

export const metadata: Metadata = {
  title: "Agent",
  description: "Chat with the Synapse AI agent about your workspace.",
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default async function AgentPage() {
  // The dashboard layout already redirects signed-out users; this only
  // personalises the greeting.
  const session = await auth.api.getSession({ headers: await headers() })
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  return <ChatLayout greeting={greeting()} firstName={firstName} />
}
