"use client"

import * as React from "react"
import { toast } from "sonner"
import { Search, UserMinus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { getInitials } from "@/components/projects/project-card"
import type { TeamMemberData } from "@/components/projects/project-members-sidebar"

type WorkspaceMemberOption = { userId: string; name: string; avatar: string | null }

export interface ManageProjectMembersDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  members: TeamMemberData[]
  onChanged: () => void
}

export function ManageProjectMembersDialog({
  projectId,
  open,
  onOpenChange,
  members,
  onChanged,
}: ManageProjectMembersDialogProps) {
  const [roster, setRoster] = React.useState<WorkspaceMemberOption[]>([])
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setQuery("")
    fetch("/api/workspaces/members")
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return setRoster([])
        setRoster(
          j.members.map((m: { userId: string; name: string; avatar: string | null }) => ({
            userId: m.userId,
            name: m.name,
            avatar: m.avatar,
          }))
        )
      })
      .catch(() => setRoster([]))
  }, [open])

  const memberIds = new Set(members.map((m) => m.id))
  const addable = roster.filter(
    (m) => !memberIds.has(m.userId) && m.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  async function addMember(userId: string) {
    setBusyUserId(userId)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member")
    } finally {
      setBusyUserId(null)
    }
  }

  async function removeMember(userId: string) {
    setBusyUserId(userId)
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(680px,calc(100dvh-40px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-1 border-b border-border/70 px-6 py-4 text-left">
          <DialogTitle className="text-base">Project members</DialogTitle>
          <DialogDescription className="text-[13px]">
            Only people added here can be assigned tasks on this project.
          </DialogDescription>
        </DialogHeader>

        {/* Current roster */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            In this project · {members.length}
          </p>
          <div className="flex flex-col gap-0.5">
            {members.map((m) => {
              const role = MEMBER_ROLE_CONFIG[m.role as MemberRoleKey]
              return (
                <div
                  key={m.id}
                  className="group flex h-12 items-center gap-3 rounded-lg px-2.5 transition-colors hover:bg-accent/50"
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={m.image || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-5 text-foreground">{m.name}</p>
                    <p className="truncate text-[12px] leading-4 text-muted-foreground">{m.email}</p>
                  </div>
                  {role && (
                    <span
                      className={cn(
                        "hidden h-4.5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium leading-none sm:inline-flex",
                        role.className
                      )}
                    >
                      {role.label}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busyUserId === m.id}
                    onClick={() => removeMember(m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <UserMinus className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add from workspace */}
        <div className="flex min-h-0 flex-col border-t border-border/70 bg-muted/20 px-3 py-3">
          <p className="px-2.5 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Add from workspace
          </p>
          <div className="relative px-0.5 pb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workspace members…"
              className="h-9 rounded-lg pl-9 text-[13px]"
            />
          </div>

          <div className="max-h-44 min-h-0 overflow-y-auto">
            {addable.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
                <Users className="size-4 text-muted-foreground" />
                <p className="text-[12px] text-muted-foreground">
                  {query.trim()
                    ? "No workspace members match that search."
                    : "Everyone in the workspace is already a member."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {addable.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    disabled={busyUserId === m.userId}
                    onClick={() => addMember(m.userId)}
                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Avatar className="size-6.5 shrink-0">
                      <AvatarImage src={m.avatar || undefined} />
                      <AvatarFallback className="text-[10px]">{getInitials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{m.name}</span>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
