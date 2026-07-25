"use client"

import { useState, type FormEvent, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { signIn, signUp } from "@/lib/auth-client"
import {
  AuthDivider,
  AuthError,
  AuthHeader,
  AuthSwitch,
  Field,
  GoogleButton,
  PasswordField,
  SubmitButton,
} from "@/components/auth/auth-parts"

function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/home"

  const handleEmailSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      // better-auth resolves with { data, error } rather than throwing, so the
      // failure case has to be read off the result.
      const { error: authError } = await signUp.email({ name, email, password })

      if (authError) {
        setError(
          authError.message || "We couldn't create your account. Please try again.",
        )
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (thrown) {
      console.error(thrown)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setGoogleLoading(true)

    try {
      const { error: authError } = await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      })

      if (authError) {
        setError(authError.message || "Google sign up is not available right now.")
        setGoogleLoading(false)
      }
      // On success the browser is redirected to Google, so the spinner stays.
    } catch (thrown) {
      console.error(thrown)
      setError("Google sign up is not available right now.")
      setGoogleLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <>
      <AuthHeader
        title="Create your workspace"
        subtitle="Connect your first source and start asking questions in minutes."
      />

      <div className="mt-8 flex flex-col gap-5">
        <GoogleButton
          onClick={handleGoogleSignUp}
          loading={googleLoading}
          disabled={busy}
          label="Continue with Google"
        />

        <AuthDivider />

        <form className="flex flex-col gap-4" onSubmit={handleEmailSignUp}>
          <Field
            id="name"
            label="Full name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
            required
            disabled={busy}
          />

          <Field
            id="email"
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            disabled={busy}
          />

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={busy}
            hint="Use 8 or more characters."
          />

          {error && <AuthError message={error} />}

          <SubmitButton loading={loading} disabled={busy}>
            Create account
          </SubmitButton>
        </form>

        <p className="text-ink-faint text-center text-[12px] leading-[1.55]">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-ink-soft underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-ink-soft underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <AuthSwitch
          prompt="Already have an account?"
          href="/sign-in"
          label="Sign in"
        />
      </div>
    </>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
