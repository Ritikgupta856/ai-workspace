import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tasks",
  description: "Track and manage tasks across your projects.",
}

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
