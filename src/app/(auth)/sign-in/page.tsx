"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Compass, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        try {
            setLoading(true);
            await signIn.email({ email, password });
            window.location.href = "/home";
        } catch (authError) {
            console.error(authError);
            setError("Invalid email or password.");
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
                callbackURL: "/home",
            });
        } catch (authError) {
            console.error(authError);
            setError("Google sign in is not available right now.");
            setGoogleLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
            <section className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-lg sm:p-8">
                <div className="mb-8 space-y-4 text-center">
                    <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-primary">
                        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10">
                            <Compass className="size-4" />
                        </span>
                        Synapse
                    </Link>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Sign in to your AI workspace.
                        </p>
                    </div>
                </div>

                <div className="space-y-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full rounded-2xl border-border bg-card text-sm font-semibold"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                    >
                        {googleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-[0.16em]">
                            <span className="bg-card px-3 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleEmailSignIn}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground" htmlFor="email">
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
                                className="h-12 rounded-2xl border-border bg-muted text-sm focus-visible:bg-card"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <label className="text-sm font-medium text-foreground" htmlFor="password">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                className="h-12 rounded-2xl border-border bg-muted text-sm focus-visible:bg-card"
                            />
                        </div>

                        {error ? (
                            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                                {error}
                            </p>
                        ) : null}

                        <Button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold hover:bg-primary/90"
                        >
                            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                            Sign in
                        </Button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="font-semibold text-primary hover:text-primary/80">
                        Sign up
                    </Link>
                </p>
            </section>
        </main>
    );
}
