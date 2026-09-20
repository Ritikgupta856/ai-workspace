"use client"

import * as React from "react"
import { toast } from "sonner"
import { UserMinus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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

  React.useEffect(() => {
    if (!open) return
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
  const addable = roster.filter((m) => !memberIds.has(m.userId))

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project members</DialogTitle>
          <DialogDescription>
            Only people added here can be assigned tasks on this project.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-md px-1.5 py-1.5">
              <Avatar className="size-7">
                <AvatarImage src={m.image || undefined} />
                <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busyUserId === m.id}
                onClick={() => removeMember(m.id)}
                aria-label={`Remove ${m.name}`}
              >
                <UserMinus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <Command className="rounded-md border">
          <CommandInput placeholder="Add a workspace member..." />
          <CommandList>
            <CommandEmpty>Everyone in the workspace is already a member.</CommandEmpty>
            <CommandGroup>
              {addable.map((m) => (
                <CommandItem
                  key={m.userId}
                  disabled={busyUserId === m.userId}
                  onSelect={() => addMember(m.userId)}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={m.avatar || undefined} />
                    <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  {m.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
