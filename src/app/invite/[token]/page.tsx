"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Compass, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { StatusBadge } from "@/components/common/status-badge"

interface InviteData {
  email: string
  role: string
  workspaceName: string
  inviterName: string
  message: string | null
  expiresAt: string
}

type PageState = "loading" | "valid" | "error" | "accepting" | "accepted"

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = useSession()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [pageState, setPageState] = useState<PageState>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [emailMismatch, setEmailMismatch] = useState(false)

  useEffect(() => {
    if (sessionLoading) return

    const user = session?.user
    if (!user) {
      router.push(`/sign-in?callbackUrl=/invite/${token}`)
      return
    }

    const currentEmail = user.email

    async function loadInvite() {
      try {
        const res = await fetch(`/api/workspaces/invites/${token}`)
        const data = await res.json()

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Failed to load invitation")
          setPageState("error")
          return
        }

        setInvite(data.invite)

        if (currentEmail?.toLowerCase() !== data.invite.email.toLowerCase()) {
          setEmailMismatch(true)
          setErrorMessage(
            `This invitation was sent to ${data.invite.email}, but you are signed in as ${currentEmail}`
          )
          setPageState("error")
          return
        }

        setPageState("valid")
      } catch {
        setErrorMessage("Failed to load invitation")
        setPageState("error")
      }
    }

    loadInvite()
  }, [token, session, sessionLoading, router])

  const handleAccept = async () => {
    setPageState("accepting")
    try {
      const res = await fetch("/api/workspaces/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to accept invitation")
        setPageState("error")
        return
      }

      setPageState("accepted")
    } catch {
      setErrorMessage("Failed to accept invitation")
      setPageState("error")
    }
  }

  if (sessionLoading || pageState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Spinner className="size-8 text-blue-600" />
          <p className="text-sm font-medium">Loading invitation...</p>
        </div>
      </main>
    )
  }

  if (pageState === "accepted") {
    const roleConfig = invite ? MEMBER_ROLE_CONFIG[invite.role as MemberRoleKey] : null
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            You&apos;re in!
          </h1>
          {invite && (
            <p className="text-muted-foreground mb-6">
              You have joined <strong>{invite.workspaceName}</strong>
              {roleConfig ? (
                <span>
                  {" "}as <StatusBadge label={roleConfig.label} className={roleConfig.className} icon={roleConfig.icon} />
                </span>
              ) : null}
              .
            </p>
          )}
          <Button
            onClick={() => router.push("/home")}
            className="w-full h-12 rounded-2xl bg-primary text-sm font-semibold hover:bg-primary/90"
          >
            Go to Dashboard
          </Button>
        </div>
      </main>
    )
  }

  if (pageState === "error") {
    const isExpired = errorMessage.toLowerCase().includes("expired")
    const isCancelled = errorMessage.toLowerCase().includes("cancelled")
    const isAccepted = errorMessage.toLowerCase().includes("accepted")
    const isWrongUser = errorMessage.toLowerCase().includes("sent to")

    let icon = <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
    let title = "Invitation Error"
    if (isExpired) {
      icon = <Clock className="size-8 text-amber-600 dark:text-amber-400" />
      title = "Invitation Expired"
    } else if (isCancelled) {
      icon = <XCircle className="size-8 text-red-600 dark:text-red-400" />
      title = "Invitation Cancelled"
    } else if (isAccepted) {
      icon = <CheckCircle className="size-8 text-blue-600 dark:text-blue-400" />
      title = "Already Accepted"
    } else if (isWrongUser) {
      icon = <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
      title = "Email Mismatch"
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            {icon}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            {title}
          </h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          {emailMismatch ? (
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/sign-in?callbackUrl=" + encodeURIComponent(`/invite/${token}`))}
                variant="outline"
                className="w-full h-12 rounded-2xl text-sm font-semibold"
              >
                Sign in with a different account
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push("/home")}
              variant="outline"
              className="w-full h-12 rounded-2xl text-sm font-semibold"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </main>
    )
  }

  if (!invite) return null

  const roleConfig = MEMBER_ROLE_CONFIG[invite.role as MemberRoleKey]
  const expiresDate = new Date(invite.expiresAt)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10">
              <Compass className="size-4" />
            </span>
            Synapse
          </Link>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Compass className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              You&apos;re Invited!
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                <strong>{invite.inviterName}</strong> has invited you to join
              </p>
              <h2 className="text-xl font-bold text-foreground mt-1">
                {invite.workspaceName}
              </h2>
            </div>

            <div className="flex justify-center">
              {roleConfig ? (
                <StatusBadge
                  label={roleConfig.label}
                  className={roleConfig.className}
                  icon={roleConfig.icon}
                />
              ) : null}
            </div>

            {invite.message ? (
              <div className="bg-muted/50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm text-muted-foreground italic">
                &ldquo;{invite.message}&rdquo;
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>Expires {expiresDate.toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleAccept}
              disabled={pageState === "accepting"}
              className="w-full h-12 rounded-2xl bg-primary text-sm font-semibold hover:bg-primary/90"
            >
              {pageState === "accepting" ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By accepting, you agree to join {invite.workspaceName} on Synapse.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
