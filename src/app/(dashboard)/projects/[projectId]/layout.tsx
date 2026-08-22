import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Project",
  description: "Project overview, tasks and activity.",
}

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
