import { AuthBrandPanel } from "@/components/auth/auth-brand-panel"

/**
 * Split auth shell: form on the left at a fixed reading measure, brand panel on
 * the right. The panel collapses below lg so small screens get the form
 * immediately instead of scrolling past marketing.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-1 bg-white">
      <main className="flex min-w-0 flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:px-10 xl:px-14 2xl:px-20">
        <div className="mx-auto w-full max-w-100">{children}</div>
      </main>

      <AuthBrandPanel />
    </div>
  )
}
