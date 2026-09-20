import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page",
  description: "Read and edit this page.",
}

export default function PageDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
