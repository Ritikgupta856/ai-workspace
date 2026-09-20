import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Task",
  description: "View and edit this task.",
}

export default function TaskDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
