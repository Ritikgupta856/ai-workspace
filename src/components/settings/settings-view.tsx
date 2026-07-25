"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

/** Section wrapper — kept local so settings doesn't add a component to /ui. */
function Section({
  title,
  description,
  children,
  footer,
  tone = "default",
}: {
  title: string
  description: string
  children?: React.ReactNode
  footer?: React.ReactNode
  tone?: "default" | "danger"
}) {
  const danger = tone === "danger"
  return (
    <section
      className={`overflow-hidden rounded-xl border ${danger ? "border-destructive/30" : ""}`}
    >
      <div className="p-5 sm:p-6">
        <h2
          className={`text-base font-semibold tracking-tight ${danger ? "text-destructive" : ""}`}
        >
          {title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        {children && <div className="mt-5">{children}</div>}
      </div>

      {footer && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 sm:px-6 ${
            danger ? "border-destructive/30 bg-destructive/5" : "bg-muted/40"
          }`}
        >
          {footer}
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

export function SettingsView({
  profile,
  workspace,
  role,
}: {
  profile: Profile
  workspace: Workspace
  role: string
}) {
  const router = useRouter()

  const [name, setName] = React.useState(profile.name)
  const [savingProfile, setSavingProfile] = React.useState(false)

  const [wsName, setWsName] = React.useState(workspace.name)
  const [wsDescription, setWsDescription] = React.useState(
    workspace.description ?? ""
  )
  const [savingWorkspace, setSavingWorkspace] = React.useState(false)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)

  const roleConfig = MEMBER_ROLE_CONFIG[role as MemberRoleKey]
  const RoleIcon = roleConfig?.icon
  const canEditWorkspace = role === "OWNER" || role === "ADMIN"
  const isOwner = role === "OWNER"

  const profileDirty = name.trim() !== profile.name.trim()
  const workspaceDirty =
    wsName.trim() !== workspace.name.trim() ||
    wsDescription.trim() !== (workspace.description ?? "").trim()

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await updateProfile({ name: name.trim() })
      toast.success("Profile updated")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      )
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSaveWorkspace() {
    setSavingWorkspace(true)
    try {
      await updateWorkspace(workspace.id, {
        name: wsName.trim(),
        description: wsDescription.trim(),
      })
      toast.success("Workspace updated")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update workspace"
      )
    } finally {
      setSavingWorkspace(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteWorkspace(workspace.id)
      toast.success("Workspace deleted")
      setDeleteOpen(false)
      router.push("/home")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace"
      )
      setDeleting(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {/* ── Profile ──────────────────────────────────────────── */}
      <Section
        title="Profile"
        description="How you appear to other people in this workspace."
        footer={
          <>
            <p className="text-muted-foreground text-xs">
              Joined {formatCreatedDate(profile.createdAt)}
            </p>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={!profileDirty || savingProfile || name.trim().length < 2}
            >
              {savingProfile && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials(profile.name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile.name || "Unnamed"}
              </p>
              <p className="text-muted-foreground truncate text-sm">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="email"
              hint="Managed by your sign-in method."
            >
              <div className="relative">
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  disabled
                  className="pr-9"
                />
                <Lock className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Workspace ────────────────────────────────────────── */}
      <Section
        title="Workspace"
        description={
          canEditWorkspace
            ? "Name and describe this workspace for your team."
            : "Only owners and admins can change these details."
        }
        footer={
          canEditWorkspace ? (
            <>
              <p className="text-muted-foreground text-xs">
                {workspace.memberCount}{" "}
                {workspace.memberCount === 1 ? "member" : "members"} ·{" "}
                {workspace.projectCount}{" "}
                {workspace.projectCount === 1 ? "project" : "projects"}
              </p>
              <Button
                size="sm"
                onClick={handleSaveWorkspace}
                disabled={
                  !workspaceDirty || savingWorkspace || wsName.trim().length < 3
                }
              >
                {savingWorkspace && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              {workspace.memberCount}{" "}
              {workspace.memberCount === 1 ? "member" : "members"} ·{" "}
              {workspace.projectCount}{" "}
              {workspace.projectCount === 1 ? "project" : "projects"}
            </p>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Your role</span>
            <Badge
              variant="secondary"
              className={cn("gap-1.5 font-medium", roleConfig?.className)}
            >
              {RoleIcon && <RoleIcon className="size-3" />}
              {roleConfig?.label ?? role}
            </Badge>
          </div>

          <Field label="Workspace name" htmlFor="ws-name">
            <Input
              id="ws-name"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              disabled={!canEditWorkspace}
              maxLength={50}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="ws-description"
            hint={`${wsDescription.length}/200`}
          >
            <Textarea
              id="ws-description"
              value={wsDescription}
              onChange={(e) => setWsDescription(e.target.value)}
              disabled={!canEditWorkspace}
              rows={3}
              maxLength={200}
              placeholder="What does this team work on?"
              className="resize-none"
            />
          </Field>

          <Field label="Workspace URL" hint="Generated from the name at creation.">
            <div className="bg-muted/40 text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
              <span className="truncate">/{workspace.slug}</span>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Danger zone ──────────────────────────────────────── */}
      {isOwner && (
        <Section
          tone="danger"
          title="Delete workspace"
          description="Permanently removes this workspace and every project, task, note, document and chat inside it. This cannot be undone."
          footer={
            <>
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
            </>
          }
        />
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {workspace.name}?</DialogTitle>
            <DialogDescription>
              This deletes {workspace.projectCount}{" "}
              {workspace.projectCount === 1 ? "project" : "projects"} and all
              related tasks, notes, documents and chats. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Field
            label={`Type "${workspace.name}" to confirm`}
            htmlFor="confirm-delete"
          >
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={workspace.name}
              autoComplete="off"
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
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
