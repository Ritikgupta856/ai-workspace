import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Members",
  description: "Manage workspace members, roles and invitations.",
}

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
