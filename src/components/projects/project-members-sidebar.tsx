"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"

export interface TeamMemberData {
  id: string
  name: string
  email: string
  image?: string | null
  role: string
  online: boolean
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ProjectMembersSidebar({ members }: { members: TeamMemberData[] }) {
  const visibleMembers = members.slice(0, 4)
  const remaining = members.length - 4

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Members{" "}
          <span className="text-muted-foreground font-normal">{members.length}</span>
        </h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          Manage
          <ChevronRight className="size-3" />
        </Button>
      </div>
      <div className="space-y-3">
        {visibleMembers.map((member) => {
          const roleConfig = MEMBER_ROLE_CONFIG[member.role as MemberRoleKey]
          return (
            <div key={member.id} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="size-9">
                  <AvatarImage src={member.image || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                    member.online ? "bg-emerald-500" : "bg-muted-foreground"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium shrink-0",
                  roleConfig?.className || "bg-muted text-muted-foreground"
                )}
              >
                {roleConfig?.label || member.role}
              </Badge>
            </div>
          )
        })}
      </div>
      {remaining > 0 && (
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground">
          +{remaining} more member{remaining === 1 ? "" : "s"}
        </Button>
      )}
    </div>
  )
}
