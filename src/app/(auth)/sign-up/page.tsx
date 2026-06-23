"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Compass, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      await signUp.email({ name, email, password });
      window.location.href = "/trips";
    } catch (authError) {
      console.error(authError);
      setError("We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    try {
      setGoogleLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/trips",
      });
    } catch (authError) {
      console.error(authError);
      setError("Google sign up is not available right now.");
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(48,28,112,0.12)] sm:p-8">
        <div className="mb-8 space-y-4 text-center">
          <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-violet-700">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-violet-100">
              <Compass className="size-4" />
            </span>
            synapse
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Create an account
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Start saving trips and generating itineraries.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-slate-200 bg-white text-sm font-semibold"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.16em]">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignUp}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ritik Gupta"
                autoComplete="name"
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm focus-visible:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm focus-visible:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm focus-visible:bg-white"
              />
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="h-12 w-full rounded-2xl bg-violet-700 text-sm font-semibold hover:bg-violet-800"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-700 hover:text-violet-900">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
