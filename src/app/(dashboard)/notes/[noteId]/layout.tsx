import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Note",
  description: "Read and edit this note.",
}

export default function NoteDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
