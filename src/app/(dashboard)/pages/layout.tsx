import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pages",
  description: "Create, organize and share pages across your workspace.",
}

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
