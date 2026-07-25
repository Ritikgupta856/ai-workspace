"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { GoogleColor } from "@/components/landing/brand-logos"

/**
 * Shared auth primitives. Same tokens, radii and type scale as the landing
 * page so signing in doesn't feel like a different product.
 */

/* ── Header ─────────────────────────────────────────────────── */

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col">
      <Link href="/" className="w-fit" aria-label="Synapse home">
        <Image
          src="/images/synapse-logo.svg"
          alt="Synapse"
          width={120}
          height={40}
          className="h-8 w-auto"
          priority
        />
      </Link>

      <h1 className="text-ink mt-8 text-xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-2xl">
        {title}
      </h1>
      <p className="text-ink-soft mt-2 text-sm leading-[1.6]">
        {subtitle}
      </p>
    </div>
  )
}

/* ── Google OAuth button ────────────────────────────────────── */

export function GoogleButton({
  onClick,
  loading,
  disabled,
  label,
}: {
  onClick: () => void
  loading: boolean
  disabled: boolean
  label: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="border-line text-ink hover:bg-surface-1 h-11 w-full gap-2.5 rounded-lg bg-white text-[14.5px] font-medium shadow-rest"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleColor className="size-4" />
      )}
      {label}
    </Button>
  )
}

/* ── Divider ────────────────────────────────────────────────── */

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="bg-line h-px flex-1" />
      <span className="text-ink-faint text-[11px] font-medium tracking-[0.1em] uppercase">
        or
      </span>
      <span className="bg-line h-px flex-1" />
    </div>
  )
}

/* ── Field ──────────────────────────────────────────────────── */

type FieldProps = React.ComponentProps<"input"> & {
  label: string
  id: string
  /** Rendered to the right of the label — e.g. a "Forgot password?" link. */
  action?: React.ReactNode
  hint?: string
}

export function Field({
  label,
  id,
  action,
  hint,
  className,
  ...props
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="text-ink text-[13px] font-medium tracking-[-0.005em]"
        >
          {label}
        </label>
        {action}
      </div>
      <Input
        id={id}
        className={cn(
          "border-line text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:ring-brand/18 h-11 rounded-lg bg-white px-3.5 text-[14.5px] shadow-rest transition-colors focus-visible:ring-2 focus-visible:ring-offset-0",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-ink-faint text-[12px]">{hint}</p>}
    </div>
  )
}

/* ── Password field with a visibility toggle ────────────────── */

export function PasswordField({
  label,
  id,
  action,
  hint,
  ...props
}: Omit<FieldProps, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="text-ink text-[13px] font-medium tracking-[-0.005em]"
        >
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="border-line text-ink placeholder:text-ink-faint focus-visible:border-brand focus-visible:ring-brand/18 h-11 rounded-lg bg-white pr-11 pl-3.5 text-[14.5px] shadow-rest transition-colors focus-visible:ring-2 focus-visible:ring-offset-0"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-ink-faint hover:text-ink absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && <p className="text-ink-faint text-[12px]">{hint}</p>}
    </div>
  )
}

/* ── Error ──────────────────────────────────────────────────── */

export function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="text-destructive border-destructive/20 bg-destructive/8 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] leading-[1.5]"
    >
      <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={2} />
      {message}
    </p>
  )
}

/* ── Submit ─────────────────────────────────────────────────── */

export function SubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      disabled={disabled}
      className="h-11 w-full gap-2 rounded-lg text-[14.5px] font-medium shadow-rest"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}

/* ── Switch between sign-in and sign-up ─────────────────────── */

export function AuthSwitch({
  prompt,
  href,
  label,
}: {
  prompt: string
  href: string
  label: string
}) {
  return (
    <p className="text-ink-soft text-center text-[13.5px]">
      {prompt}{" "}
      <Link
        href={href}
        className="text-brand-ink font-medium underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    </p>
  )
}
