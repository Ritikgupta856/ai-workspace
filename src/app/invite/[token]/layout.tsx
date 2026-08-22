import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join workspace",
  description: "You've been invited to join a Synapse workspace.",
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
