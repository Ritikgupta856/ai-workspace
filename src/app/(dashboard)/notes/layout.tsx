import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notes",
  description: "Create, organize and share notes across your workspace.",
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
