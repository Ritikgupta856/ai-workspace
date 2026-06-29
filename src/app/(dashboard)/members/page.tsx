"use client"

import * as React from "react"
import { Users, Shield, User, Eye, ListFilter, MoreHorizontal, Link2, RotateCw, Ban, UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { MemberCardMenu } from "@/components/members/member-card-menu"
import { formatUpdatedDate, formatCreatedDate } from "@/lib/date"
import { InviteMemberDialog } from "@/components/members/invite-member-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

export type Member = {
  id: string
  name: string
  email: string
  role: MemberRoleKey
  avatar: string | null
  joinedAt: string
  lastActive: string
  taskCount: number
}

export type Invitation = {
  id: string
  email: string
  role: MemberRoleKey
  status: string
  token: string
  invitedBy: {
    name: string | null
    email: string
  }
  createdAt: string
  expiresAt: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

type MemberFilter = "all" | "admins" | "members" | "viewers"

const filterOptions: { value: MemberFilter; label: string; icon: typeof ListFilter }[] = [
  { value: "all", label: "All Members", icon: Users },
  { value: "admins", label: "Admins", icon: Shield },
  { value: "members", label: "Members", icon: User },
  { value: "viewers", label: "Viewers", icon: Eye },
]

const memberColumns: ColumnDef<Member>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const member = row.original
      const initials = getInitials(member.name)
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {member.avatar ? (
              <AvatarImage src={member.avatar} alt={member.name} />
            ) : null}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{member.name}</span>
            <span className="text-xs text-muted-foreground">{member.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const config = MEMBER_ROLE_CONFIG[row.original.role]
      return (
        <StatusBadge
          label={config.label}
          className={config.className}
          icon={config.icon}
        />
      )
    },
  },
  {
    accessorKey: "taskCount",
    header: "Tasks",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {row.original.taskCount}
      </span>
    ),
  },
  {
    accessorKey: "lastActive",
    header: "Last Active",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatUpdatedDate(row.original.lastActive)}
      </span>
    ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatCreatedDate(row.original.joinedAt)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <MemberCardMenu
        memberId={row.original.id}
        role={row.original.role}
        onView={(id) => console.log("View", id)}
        onChangeRole={(id) => console.log("Change role", id)}
        onRemove={(id) => console.log("Remove", id)}
      />
    ),
  },
]

function useInvitationColumns(onRefresh?: () => void) {
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const [cancelTarget, setCancelTarget] = React.useState<Invitation | null>(null)

  const appUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
    : "http://localhost:3000"

  const handleCopyLink = async (invitation: Invitation) => {
    try {
      const url = `${appUrl}/invite/${invitation.token}`
      await navigator.clipboard.writeText(url)
      toast.success("Invite link copied to clipboard")
    } catch {
      toast.error("Failed to copy invite link")
    }
  }

  const handleResend = async (invitation: Invitation) => {
    setActionLoading(invitation.id)
    try {
      const res = await fetch("/api/workspaces/invites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invitation.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend invitation")
      }
      toast.success("Invitation resent successfully")
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invitation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setActionLoading(cancelTarget.id)
    try {
      const res = await fetch("/api/workspaces/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelTarget.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel invitation")
      }
      toast.success("Invitation cancelled")
      setCancelDialogOpen(false)
      setCancelTarget(null)
      onRefresh?.()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invitation")
    } finally {
      setActionLoading(null)
    }
  }

  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm font-medium text-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const config = MEMBER_ROLE_CONFIG[row.original.role]
        return (
          <StatusBadge
            label={config.label}
            className={config.className}
            icon={config.icon}
          />
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "invitedBy",
      header: "Invited By",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.invitedBy.name || row.original.invitedBy.email}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Sent Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatCreatedDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "expiresAt",
      header: "Expiration Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatCreatedDate(row.original.expiresAt)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invitation = row.original
        const isLoading = actionLoading === invitation.id
        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-8" disabled={isLoading}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleCopyLink(invitation)}>
                  <Link2 className="size-4 mr-2" />
                  Copy Invite Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResend(invitation)} disabled={isLoading}>
                  <RotateCw className="size-4 mr-2" />
                  Resend
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCancelTarget(invitation)
                    setCancelDialogOpen(true)
                  }}
                  className="text-destructive focus:text-destructive"
                  disabled={isLoading}
                >
                  <Ban className="size-4 mr-2" />
                  Cancel Invitation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={cancelDialogOpen && cancelTarget?.id === invitation.id} onOpenChange={setCancelDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cancel Invitation</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel the invitation for{" "}
                    <strong>{cancelTarget?.email}</strong>? They will no longer be able to accept it.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCancelDialogOpen(false)
                      setCancelTarget(null)
                    }}
                  >
                    Keep Invitation
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancelConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )
      },
    },
  ]

  return { columns, fetchTrigger: actionLoading }
}

function FilterTrigger({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export default function MembersPage() {
  const [memberFilter, setMemberFilter] = React.useState<MemberFilter>("all")
  const [memberList, setMemberList] = React.useState<Member[]>([])
  const [invitationList, setInvitationList] = React.useState<Invitation[]>([])
  const [currentUserRole, setCurrentUserRole] = React.useState<string>("MEMBER")
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/workspaces/members"),
        fetch("/api/workspaces/invites"),
      ])

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        if (membersData.success) {
          setMemberList(membersData.members)
          setCurrentUserRole(membersData.currentUserRole)
        }
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json()
        if (invitesData.success) {
          setInvitationList(invitesData.invites)
        }
      }
    } catch (error) {
      console.error("Failed to load workspace member data", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredMembers = React.useMemo(() => {
    let filtered = memberList

    switch (memberFilter) {
      case "admins":
        filtered = filtered.filter((m) => m.role === "OWNER" || m.role === "ADMIN")
        break
      case "members":
        filtered = filtered.filter((m) => m.role === "MEMBER")
        break
      case "viewers":
        filtered = filtered.filter((m) => m.role === "VIEWER")
        break
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [memberFilter, memberList, search])

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN"

  const { columns: invitationColumns } = useInvitationColumns(fetchData)

  return (
    <div className="flex flex-1 flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <PageHeading
          title="Members"
          description="Manage workspace members and invitations."
        />

        <div className="flex items-center gap-4">
          <SearchInput
            placeholder="Search members..."
            value={search}
            onValueChange={setSearch}
          />
          <Button
            onClick={() => setIsInviteOpen(true)}
            disabled={!canInvite}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <UserPlus className="size-4" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
            {filterOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <FilterTrigger
                  key={opt.value}
                  active={memberFilter === opt.value}
                  onClick={() => setMemberFilter(opt.value)}
                >
                  <Icon className="size-4" />
                  {opt.label}
                </FilterTrigger>
              )
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-lg bg-card text-muted-foreground shadow-sm">
            <Spinner className="size-8 text-blue-600 mb-2" />
            <p className="text-sm font-medium">Loading workspace members...</p>
          </div>
        ) : (
          <DataTable columns={memberColumns} data={filteredMembers} />
        )}
      </div>

      {/* Pending Invitations Section */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Pending Invitations
          </h2>
          <p className="text-sm text-muted-foreground">
            Invitations sent to people who haven&apos;t joined your workspace yet.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card text-muted-foreground shadow-sm">
            <Spinner className="size-6 text-blue-600 mb-2" />
            <p className="text-sm font-medium">Loading invitations...</p>
          </div>
        ) : invitationList.length > 0 ? (
          <DataTable columns={invitationColumns} data={invitationList} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed bg-card/50 text-muted-foreground text-center p-6">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No pending invitations</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              All invitations have been accepted or expired. Invite new users to collaborate.
            </p>
            {canInvite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
              >
                Invite Member
              </Button>
            )}
          </div>
        )}
      </div>

      <InviteMemberDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}
