"use client"

import * as React from "react"
import {
  MoreHorizontal,
  User,
  Shield,
  Eye,
  Crown,
  Mail,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"

export interface MemberCardMenuProps {
  memberId: string
  role: MemberRoleKey
  onView?: (id: string) => void
  onChangeRole?: (id: string) => void
  onRemove?: (id: string) => void
}

const roleIcons: Record<MemberRoleKey, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
}

export function MemberCardMenu({
  memberId,
  role,
  onView,
  onChangeRole,
  onRemove,
}: MemberCardMenuProps) {
  const RoleIcon = roleIcons[role]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView?.(memberId)}>
          <User className="size-4" />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChangeRole?.(memberId)}>
          <RoleIcon className="size-4" />
          Change Role
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => console.log("Send email", memberId)}>
          <Mail className="size-4" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onRemove?.(memberId)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
