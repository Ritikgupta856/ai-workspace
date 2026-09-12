"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, TriangleAlert, User, Building2, SlidersHorizontal, CreditCard } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { SearchInput } from "@/components/ui/search-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { formatCreatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import {
  deleteWorkspace,
  updateProfile,
  updateWorkspace,
} from "@/lib/api/settings"

type Profile = {
  name: string
  email: string
  image: string | null
  createdAt: string
}

type Workspace = {
  id: string
  name: string
  slug: string
  description: string | null
  memberCount: number
  projectCount: number
}

type Subscription = {
  status: "PENDING" | "ACTIVE" | "ON_HOLD" | "PAUSED" | "CANCELLED" | "FAILED" | "EXPIRED" | "PAST_DUE"
  currentPeriodEnd: string | null
  cancelAtNextBillingDate: boolean
}

type SettingsData = {
  profile: Profile
  workspace: Workspace
  role: string
  subscription: Subscription | null
}

type Section = "profile" | "workspace" | "preferences" | "billing"

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "billing", label: "Billing", icon: CreditCard },
]

function initials(name: string, fallback: string) {
  const source = name.trim() || fallback
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Label-left / control-right settings row, divided by a hairline. */
function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

/** Field wrapper for the delete-workspace confirmation dialog only. */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  const [section, setSection] = React.useState<Section>("profile")
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<SettingsData | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData({
            profile: json.profile,
            workspace: json.workspace,
            role: json.role,
            subscription: json.subscription,
          })
        } else {
          toast.error(json.error || "Failed to load settings")
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    if (open) load()
  }, [open, load])

  const filteredSections = SECTIONS.filter((s) =>
    s.label.toLowerCase().includes(query.trim().toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[600px] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your profile and workspace settings.
        </DialogDescription>

        <div className="flex h-full min-h-0">
          <div className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-3">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search"
              compact
              className="mb-3 max-w-none"
            />
            <p className="text-muted-foreground px-2 pb-1.5 text-xs font-medium uppercase tracking-wide">
              Settings
            </p>
            <div className="flex flex-col gap-0.5">
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                    section === s.id
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                >
                  <s.icon className="size-4" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {loading || !data ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : section === "profile" ? (
              <ProfilePanel profile={data.profile} onSaved={load} />
            ) : section === "workspace" ? (
              <WorkspacePanel
                workspace={data.workspace}
                role={data.role}
                onSaved={load}
                onDeleted={() => {
                  onOpenChange(false)
                  router.push("/home")
                  router.refresh()
                }}
              />
            ) : section === "preferences" ? (
              <PreferencesPanel />
            ) : (
              <BillingPanel
                workspace={data.workspace}
                role={data.role}
                subscription={data.subscription}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProfilePanel({
  profile,
  onSaved,
}: {
  profile: Profile
  onSaved: () => void
}) {
  const router = useRouter()
  const [name, setName] = React.useState(profile.name)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = React.useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (trimmed.length < 2 || trimmed === profile.name.trim()) return
      updateProfile({ name: trimmed })
        .then(() => {
          onSaved()
          router.refresh()
        })
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Failed to update profile")
        )
    },
    [profile.name, onSaved, router]
  )

  function handleChange(value: string) {
    setName(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => persist(value), 700)
  }

  function handleBlur() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    persist(name)
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-semibold tracking-tight">Profile</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        How you appear to other people in this workspace.
      </p>

      <Row label="Avatar">
        <Avatar className="size-9">
          <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {initials(profile.name, profile.email)}
          </AvatarFallback>
        </Avatar>
      </Row>

      <Row label="Full name">
        <Input
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Your name"
          maxLength={60}
          className="w-56 text-right"
        />
      </Row>

      <Row label="Email" description="Managed by your sign-in method.">
        <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Lock className="size-3.5" />
          {profile.email}
        </span>
      </Row>

      <Row label="Joined">
        <span className="text-muted-foreground text-sm">
          {formatCreatedDate(profile.createdAt)}
        </span>
      </Row>
    </div>
  )
}

function WorkspacePanel({
  workspace,
  role,
  onSaved,
  onDeleted,
}: {
  workspace: Workspace
  role: string
  onSaved: () => void
  onDeleted: () => void
}) {
  const router = useRouter()
  const [wsName, setWsName] = React.useState(workspace.name)
  const [wsDescription, setWsDescription] = React.useState(workspace.description ?? "")

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)

  const roleConfig = MEMBER_ROLE_CONFIG[role as MemberRoleKey]
  const RoleIcon = roleConfig?.icon
  const canEdit = role === "OWNER" || role === "ADMIN"
  const isOwner = role === "OWNER"

  const persist = React.useCallback(
    (nextName: string, nextDescription: string) => {
      const nameVal = nextName.trim()
      const descVal = nextDescription.trim()
      if (nameVal.length < 3) return
      if (nameVal === workspace.name.trim() && descVal === (workspace.description ?? "").trim())
        return

      updateWorkspace(workspace.id, { name: nameVal, description: descVal })
        .then(() => {
          onSaved()
          router.refresh()
        })
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "Failed to update workspace")
        )
    },
    [workspace.id, workspace.name, workspace.description, onSaved, router]
  )

  function scheduleSave(nextName: string, nextDescription: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => persist(nextName, nextDescription), 700)
  }

  function flushSave(nextName: string, nextDescription: string) {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    persist(nextName, nextDescription)
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteWorkspace(workspace.id)
      toast.success("Workspace deleted")
      onDeleted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete workspace")
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-semibold tracking-tight">Workspace</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        {canEdit
          ? "Name and describe this workspace for your team."
          : "Only owners and admins can change these details."}
      </p>

      <Row label="Your role">
        <Badge variant="secondary" className={cn("gap-1.5 font-medium", roleConfig?.className)}>
          {RoleIcon && <RoleIcon className="size-3" />}
          {roleConfig?.label ?? role}
        </Badge>
      </Row>

      <Row label="Workspace name">
        <Input
          value={wsName}
          onChange={(e) => {
            setWsName(e.target.value)
            scheduleSave(e.target.value, wsDescription)
          }}
          onBlur={() => flushSave(wsName, wsDescription)}
          disabled={!canEdit}
          maxLength={50}
          className="w-56 text-right"
        />
      </Row>

      <Row label="Workspace URL" description="Generated from the name at creation.">
        <span className="text-muted-foreground text-sm">/{workspace.slug}</span>
      </Row>

      <Row label="Members · Projects">
        <span className="text-muted-foreground text-sm">
          {workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"} ·{" "}
          {workspace.projectCount} {workspace.projectCount === 1 ? "project" : "projects"}
        </span>
      </Row>

      <div className="py-3.5">
        <label htmlFor="ws-description" className="text-sm">
          Description
        </label>
        <Textarea
          id="ws-description"
          value={wsDescription}
          onChange={(e) => {
            setWsDescription(e.target.value)
            scheduleSave(wsName, e.target.value)
          }}
          onBlur={() => flushSave(wsName, wsDescription)}
          disabled={!canEdit}
          rows={3}
          maxLength={200}
          placeholder="What does this team work on?"
          className="mt-2 resize-none"
        />
        <p className="text-muted-foreground mt-1 text-xs">{wsDescription.length}/200</p>
      </div>

      {isOwner && (
        <div className="mt-4 rounded-xl border border-destructive/30">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-destructive">Delete workspace</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Permanently removes this workspace and every project, task, note, document and chat
              inside it. This cannot be undone.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <TriangleAlert className="size-3.5" />
              {workspace.memberCount > 1
                ? `${workspace.memberCount} members will lose access.`
                : "This action is immediate."}
            </p>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setConfirmText("")
                setDeleteOpen(true)
              }}
            >
              Delete workspace
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {workspace.name}?</DialogTitle>
            <DialogDescription>
              This deletes {workspace.projectCount}{" "}
              {workspace.projectCount === 1 ? "project" : "projects"} and all related tasks,
              notes, documents and chats. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Field label={`Type "${workspace.name}" to confirm`} htmlFor="confirm-delete">
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={workspace.name}
              autoComplete="off"
            />
          </Field>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || confirmText.trim() !== workspace.name}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PreferencesPanel() {
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [desktopNotifs, setDesktopNotifs] = React.useState(true)
  const [weeklyDigest, setWeeklyDigest] = React.useState(false)
  const [compactMode, setCompactMode] = React.useState(false)

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-semibold tracking-tight">Preferences</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        Control how Synapse looks and notifies you.
      </p>

      <Row label="Email notifications" description="Get updates about tasks and mentions in your inbox.">
        <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
      </Row>
      <Row label="Desktop notifications" description="Show a system notification for new activity.">
        <Switch checked={desktopNotifs} onCheckedChange={setDesktopNotifs} />
      </Row>
      <Row label="Weekly digest" description="A Monday summary of what happened last week.">
        <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
      </Row>
      <Row label="Compact mode" description="Reduce spacing to fit more content on screen.">
        <Switch checked={compactMode} onCheckedChange={setCompactMode} />
      </Row>
    </div>
  )
}

const FREE_LIMITS = { seats: 3, projects: 5 }

const SUBSCRIPTION_STATUS_CONFIG: Record<
  Subscription["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ON_HOLD: {
    label: "Payment issue",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  PAST_DUE: {
    label: "Payment issue",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  PAUSED: { label: "Paused", className: "bg-muted text-muted-foreground" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
}

function BillingPanel({
  workspace,
  role,
  subscription,
}: {
  workspace: Workspace
  role: string
  subscription: Subscription | null
}) {
  const [redirecting, setRedirecting] = React.useState(false)
  const isOwner = role === "OWNER"
  const isPaid = subscription !== null

  async function handleUpgrade() {
    setRedirecting(true)
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to start checkout")
      window.location.href = json.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
      setRedirecting(false)
    }
  }

  function handleManageBilling() {
    setRedirecting(true)
    window.location.href = "/api/billing/portal"
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-base font-semibold tracking-tight">Billing</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-sm">
        Manage the plan and payment details for {workspace.name}.
      </p>

      <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{isPaid ? "Pro plan" : "Free plan"}</p>
            {subscription ? (
              <Badge
                variant="secondary"
                className={SUBSCRIPTION_STATUS_CONFIG[subscription.status].className}
              >
                {SUBSCRIPTION_STATUS_CONFIG[subscription.status].label}
              </Badge>
            ) : (
              <Badge variant="secondary">Current plan</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {isPaid
              ? subscription.cancelAtNextBillingDate && subscription.currentPeriodEnd
                ? `Cancels on ${formatCreatedDate(subscription.currentPeriodEnd)}`
                : subscription.currentPeriodEnd
                  ? `Renews ${formatCreatedDate(subscription.currentPeriodEnd)}`
                  : "Unlimited members and projects."
              : `Up to ${FREE_LIMITS.seats} members and ${FREE_LIMITS.projects} projects per workspace.`}
          </p>
        </div>
        {isPaid ? (
          <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={!isOwner || redirecting}>
            {redirecting && <Loader2 className="size-4 animate-spin" />}
            Manage billing
          </Button>
        ) : (
          <Button size="sm" onClick={handleUpgrade} disabled={!isOwner || redirecting}>
            {redirecting && <Loader2 className="size-4 animate-spin" />}
            Upgrade plan
          </Button>
        )}
      </div>

      {!isOwner && (
        <p className="text-muted-foreground mt-2 text-xs">
          Only the workspace owner can manage billing.
        </p>
      )}

      <div className="mt-2">
        <Row label="Members used">
          <span className="text-sm">
            {workspace.memberCount}{isPaid ? "" : ` / ${FREE_LIMITS.seats}`}
          </span>
        </Row>
        <Row label="Projects used">
          <span className="text-sm">
            {workspace.projectCount}{isPaid ? "" : ` / ${FREE_LIMITS.projects}`}
          </span>
        </Row>
      </div>

      {isPaid && (
        <p className="text-muted-foreground mt-3 text-xs">
          Payment methods and invoices are managed in the billing portal.
        </p>
      )}
    </div>
  )
}
