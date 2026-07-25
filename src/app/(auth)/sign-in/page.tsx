"use client"

import { useState, type FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { signIn } from "@/lib/auth-client"
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

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/home"

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      // better-auth resolves with { data, error } instead of throwing, so a
      // failed sign-in has to be read off the result — otherwise we'd navigate
      // away on a wrong password.
      const { error: authError } = await signIn.email({ email, password })

      if (authError) {
        setError(authError.message || "Invalid email or password.")
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

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)

    try {
      const { error: authError } = await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      })

      if (authError) {
        setError(authError.message || "Google sign in is not available right now.")
        setGoogleLoading(false)
      }
      // On success the browser is redirected to Google, so the spinner stays.
    } catch (thrown) {
      console.error(thrown)
      setError("Google sign in is not available right now.")
      setGoogleLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to pick up where your team left off."
      />

      <div className="mt-8 flex flex-col gap-5">
        <GoogleButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={busy}
          label="Continue with Google"
        />

        <AuthDivider />

        <form className="flex flex-col gap-4" onSubmit={handleEmailSignIn}>
          <Field
            id="email"
            label="Email"
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
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={busy}
          />

          {error && <AuthError message={error} />}

          <SubmitButton loading={loading} disabled={busy}>
            Sign in
          </SubmitButton>
        </form>
      </div>

      <div className="mt-8">
        <AuthSwitch
          prompt="Don't have an account?"
          href="/sign-up"
          label="Create one"
        />
      </div>
    </>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
