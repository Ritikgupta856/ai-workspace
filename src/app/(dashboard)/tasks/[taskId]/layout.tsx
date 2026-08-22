import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Task",
  description: "Task details, status and discussion.",
}

export default function TaskDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
