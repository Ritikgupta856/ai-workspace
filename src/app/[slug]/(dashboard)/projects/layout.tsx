import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects",
  description: "Plan, track and deliver your team's projects.",
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
