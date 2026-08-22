import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Integration",
  description: "Manage this integration's connection and settings.",
}

export default function IntegrationDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
