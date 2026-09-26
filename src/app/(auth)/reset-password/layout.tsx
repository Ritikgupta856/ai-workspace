import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Synapse account.",
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
