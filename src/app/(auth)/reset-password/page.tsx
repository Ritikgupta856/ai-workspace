"use client"

import { Suspense, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { resetPassword } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  AuthError,
  AuthHeader,
  AuthSwitch,
  PasswordField,
  SubmitButton,
} from "@/components/auth/auth-parts"

const LINK_BUTTON = "h-11 w-full rounded-lg text-[14.5px] font-medium shadow-rest"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  // better-auth checks the emailed link first and lands here with either
  // ?token=… or ?error=INVALID_TOKEN (expired, already used, or tampered with).
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expired, setExpired] = useState(!token || searchParams.get("error") === "INVALID_TOKEN")
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await resetPassword({ newPassword: password, token: token! })

      if (authError) {
        // The token can also expire between opening the page and submitting.
        if (authError.code === "INVALID_TOKEN") setExpired(true)
        else setError(authError.message || "Couldn't reset your password. Please try again.")
        return
      }

      setDone(true)
    } catch (thrown) {
      console.error(thrown)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (expired) {
    return (
      <>
        <AuthHeader
          title="This link has expired"
          subtitle="Reset links work once and expire after 1 hour. Request a new one to continue."
        />
        <Button asChild className={`mt-8 ${LINK_BUTTON}`}>
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
        <div className="mt-8">
          <AuthSwitch prompt="Remembered it?" href="/sign-in" label="Back to sign in" />
        </div>
      </>
    )
  }

  if (done) {
    return (
      <>
        <AuthHeader
          title="Password updated"
          subtitle="Your password has been changed and you've been signed out of other devices. Sign in with your new password."
        />
        <Button asChild className={`mt-8 ${LINK_BUTTON}`}>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <AuthHeader
        title="Choose a new password"
        subtitle="Pick something you haven't used before for Synapse."
      />

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          autoFocus
          required
          disabled={loading}
          hint="Use 8 or more characters."
        />

        <PasswordField
          id="confirm"
          label="Confirm new password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
        />

        {error && <AuthError message={error} />}

        <SubmitButton loading={loading} disabled={loading}>
          Update password
        </SubmitButton>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
