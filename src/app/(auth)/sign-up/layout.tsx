import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Synapse account and start collaborating.",
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
