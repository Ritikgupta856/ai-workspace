"use client"

import { useState, type FormEvent } from "react"

import { requestPasswordReset } from "@/lib/auth-client"
import {
  AuthError,
  AuthHeader,
  AuthSwitch,
  Field,
  SubmitButton,
} from "@/components/auth/auth-parts"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      // The server answers the same whether or not the account exists, so the
      // confirmation below never reveals who has signed up.
      const { error: authError } = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })

      if (authError) {
        setError(authError.message || "Couldn't send the reset link. Please try again.")
        return
      }

      setSentTo(email)
    } catch (thrown) {
      console.error(thrown)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <>
        <AuthHeader
          title="Check your email"
          subtitle={`If an account exists for ${sentTo}, we've sent a link to reset your password. It expires in 1 hour.`}
        />

        <p className="text-ink-soft mt-6 text-[13.5px] leading-[1.6]">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-brand-ink font-medium underline-offset-4 hover:underline"
          >
            try another email
          </button>
          .
        </p>

        <div className="mt-8">
          <AuthSwitch prompt="Remembered it?" href="/sign-in" label="Back to sign in" />
        </div>
      </>
    )
  }

  return (
    <>
      <AuthHeader
        title="Forgot your password?"
        subtitle="Enter the email you use for Synapse and we'll send you a link to reset it."
      />

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          required
          disabled={loading}
        />

        {error && <AuthError message={error} />}

        <SubmitButton loading={loading} disabled={loading}>
          Send reset link
        </SubmitButton>
      </form>

      <div className="mt-8">
        <AuthSwitch prompt="Remembered it?" href="/sign-in" label="Back to sign in" />
      </div>
    </>
  )
}
