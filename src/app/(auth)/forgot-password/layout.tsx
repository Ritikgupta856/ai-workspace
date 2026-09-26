import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset the password for your Synapse account.",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
