"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MemberData {
  id: string
  name: string
  initials: string
  role: string
  online: boolean
}

const members: MemberData[] = [
  { id: "m1", name: "Ritik Gupta", initials: "RG", role: "Owner", online: true },
  { id: "m2", name: "Priya Sharma", initials: "PS", role: "Admin", online: true },
  { id: "m3", name: "Arjun Patel", initials: "AP", role: "Member", online: false },
  { id: "m4", name: "Meera Singh", initials: "MS", role: "Member", online: true },
  { id: "m5", name: "Vikram Reddy", initials: "VR", role: "Member", online: false },
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const roleStyles: Record<string, string> = {
  Owner: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Member: "bg-muted text-muted-foreground",
}

export function ProjectMembersSidebar() {
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
        {members.slice(0, 4).map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
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
              className={cn("px-2 py-0.5 text-[10px] font-medium shrink-0", roleStyles[member.role])}
            >
              {member.role}
            </Badge>
          </div>
        ))}
      </div>
      {members.length > 4 && (
        <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground">
          +{members.length - 4} more members
        </Button>
      )}
    </div>
  )
}
