"use client"

import * as React from "react"
import { Users, Shield, User, Eye, Crown, ListFilter, Mail } from "lucide-react"
import { PageHeading } from "@/components/ui/page-heading"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/common/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { MemberCardMenu } from "@/components/members/member-card-menu"
import { formatUpdatedDate, formatCreatedDate } from "@/lib/date"

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

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Ritik Gupta",
    email: "ritik@synapse.ai",
    role: "OWNER",
    avatar: null,
    joinedAt: "2025-01-15",
    lastActive: "2026-06-27T10:30:00",
    taskCount: 24,
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya@synapse.ai",
    role: "ADMIN",
    avatar: null,
    joinedAt: "2025-03-20",
    lastActive: "2026-06-27T09:15:00",
    taskCount: 18,
  },
  {
    id: "3",
    name: "Arjun Patel",
    email: "arjun@synapse.ai",
    role: "MEMBER",
    avatar: null,
    joinedAt: "2025-06-10",
    lastActive: "2026-06-26T16:45:00",
    taskCount: 12,
  },
  {
    id: "4",
    name: "Meera Singh",
    email: "meera@synapse.ai",
    role: "MEMBER",
    avatar: null,
    joinedAt: "2025-08-05",
    lastActive: "2026-06-25T11:20:00",
    taskCount: 9,
  },
  {
    id: "5",
    name: "Vikram Reddy",
    email: "vikram@synapse.ai",
    role: "VIEWER",
    avatar: null,
    joinedAt: "2026-02-14",
    lastActive: "2026-06-24T08:00:00",
    taskCount: 3,
  },
  {
    id: "6",
    name: "Ananya Joshi",
    email: "ananya@synapse.ai",
    role: "MEMBER",
    avatar: null,
    joinedAt: "2026-04-01",
    lastActive: "2026-06-23T14:30:00",
    taskCount: 7,
  },
  {
    id: "7",
    name: "Rohan Desai",
    email: "rohan@synapse.ai",
    role: "ADMIN",
    avatar: null,
    joinedAt: "2025-11-12",
    lastActive: "2026-06-22T10:00:00",
    taskCount: 15,
  },
]

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

const columns: ColumnDef<Member>[] = [
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
  const [memberList] = React.useState<Member[]>(initialMembers)
  const [search, setSearch] = React.useState("")

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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeading
          title="Members"
          description="Manage workspace members and their roles."
        />

        <div className="flex items-center gap-4">
          <SearchInput
            placeholder="Search members..."
            value={search}
            onValueChange={setSearch}
          />
        </div>
      </div>

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

      <DataTable columns={columns} data={filteredMembers} />
    </div>
  )
}
