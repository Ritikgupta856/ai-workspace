"use client"

import Link from "next/link"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  FileCode,
  FileText,
  HeartPulse,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { activityConfig } from "@/lib/constants/activity"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { ActivityDTO } from "@/lib/activity"
import type { HealthData } from "@/components/projects/project-health"
import type { DocumentItem } from "@/components/projects/latest-documents"
import type { TeamMemberData } from "@/components/projects/project-members-sidebar"
import { getInitials } from "@/components/projects/project-card"
import { Section, SectionEmpty, sectionRowClass } from "@/components/dashboard/section"

/* ── Section shell lives in @/components/dashboard/section (server-safe) ── */

export const OverviewSection = Section
const EmptyRow = SectionEmpty
const ROW = sectionRowClass

/* ── Recent activity ────────────────────────────────────────── */

export function ActivityRows({ items, limit = 6 }: { items: ActivityDTO[]; limit?: number }) {
  if (items.length === 0) return <EmptyRow>No activity yet. Start working to see events here.</EmptyRow>
  return (
    <>
      {items.slice(0, limit).map((item) => {
        const config = activityConfig(item.type)
        const showTarget = item.target && !item.description.includes(item.target)
        return (
          <div key={item.id} className={ROW}>
            <Avatar className="size-5.5 shrink-0">
              <AvatarImage src={item.user.image ?? undefined} alt={item.user.name} />
              <AvatarFallback className="bg-muted text-[8px] font-semibold">{getInitials(item.user.name)}</AvatarFallback>
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-[13px] leading-5">
              <span className="font-medium text-foreground">{item.user.name}</span>{" "}
              <span className="text-muted-foreground">{item.description}</span>
              {showTarget && <span className="font-medium text-foreground"> {item.target}</span>}
            </p>
            <span
              className={cn(
                "hidden h-4.5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium leading-none sm:inline-flex",
                config.className
              )}
            >
              {config.label}
            </span>
            <span className="w-16 shrink-0 text-right text-[13px] text-muted-foreground">
              {formatUpdatedDate(item.createdAt)}
            </span>
          </div>
        )
      })}
    </>
  )
}

/* ── Latest documents ───────────────────────────────────────── */

const DOC_ICON: Record<string, { icon: LucideIcon; className: string }> = {
  DOC: { icon: FileText, className: "text-blue-600" },
  ISSUE: { icon: FileCode, className: "text-red-600" },
  PR: { icon: FileCode, className: "text-emerald-600" },
  NOTE: { icon: FileText, className: "text-violet-600" },
  CHAT: { icon: FileText, className: "text-amber-600" },
  CODE: { icon: FileCode, className: "text-cyan-600" },
}

export function DocumentRows({ items, limit = 5 }: { items: DocumentItem[]; limit?: number }) {
  if (items.length === 0) return <EmptyRow>No documents yet.</EmptyRow>
  return (
    <>
      {items.slice(0, limit).map((doc) => {
        const { icon: Icon, className } = DOC_ICON[doc.contentType] ?? {
          icon: FileText,
          className: "text-muted-foreground",
        }
        return (
          <div key={doc.id} className={ROW}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className={cn("size-3.5", className)} />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-foreground">{doc.name}</span>
            <span className="shrink-0 text-[13px] text-muted-foreground">{doc.updatedAt}</span>
          </div>
        )
      })}
    </>
  )
}

/* ── Project health ─────────────────────────────────────────── */

const HEALTH_SCORE: Record<HealthData["score"], { label: string; className: string }> = {
  excellent: { label: "Excellent", className: "bg-emerald-500 text-white" },
  good: { label: "Good", className: "bg-blue-500 text-white" },
  needsAttention: { label: "Needs attention", className: "bg-amber-500 text-white" },
  atRisk: { label: "At risk", className: "bg-red-500 text-white" },
}

export function healthScorePill(score: HealthData["score"]) {
  return HEALTH_SCORE[score] ?? HEALTH_SCORE.good
}

export function HealthRows({ health }: { health: HealthData }) {
  const metrics: { label: string; value: number; icon: LucideIcon; className: string }[] = [
    { label: "Active tasks", value: health.activeTasks, icon: CircleDashed, className: "text-blue-500" },
    { label: "Completed this week", value: health.completedThisWeek, icon: CheckCircle2, className: "text-emerald-500" },
    { label: "Overdue", value: health.overdueTasks, icon: AlertCircle, className: "text-red-500" },
    { label: "Unassigned", value: health.unassignedTasks, icon: UserX, className: "text-amber-500" },
    { label: "Documents updated", value: health.documentsUpdated, icon: FileText, className: "text-violet-500" },
  ]
  return (
    <>
      {metrics.map((m) => (
        <div key={m.label} className={cn(ROW, "h-9")}>
          <m.icon className={cn("size-3.5 shrink-0", m.className)} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80">{m.label}</span>
          <span className="text-sm font-medium tabular-nums text-foreground">{m.value}</span>
        </div>
      ))}
    </>
  )
}

/* ── Members ────────────────────────────────────────────────── */

export function MemberRows({ members, limit = 5 }: { members: TeamMemberData[]; limit?: number }) {
  if (members.length === 0) return <EmptyRow>No members yet.</EmptyRow>
  const remaining = members.length - limit
  return (
    <>
      {members.slice(0, limit).map((member) => {
        const role = MEMBER_ROLE_CONFIG[member.role as MemberRoleKey]
        return (
          <div key={member.id} className={cn(ROW, "h-10")}>
            <span className="relative shrink-0">
              <Avatar className="size-5.5">
                <AvatarImage src={member.image || undefined} alt={member.name} />
                <AvatarFallback className="bg-muted text-[8px] font-semibold">{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-background",
                  member.online ? "bg-emerald-500" : "bg-muted-foreground/60"
                )}
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5 text-foreground">
              {member.name}
            </span>
            <span
              className={cn(
                "inline-flex h-4.5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium leading-none",
                role?.className ?? "bg-muted text-muted-foreground"
              )}
            >
              {role?.label ?? member.role}
            </span>
          </div>
        )
      })}
      {remaining > 0 && (
        <Link
          href="?manageMembers=1"
          className="flex h-9 items-center gap-2 rounded-lg px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <Users className="size-3.5" />+{remaining} more member{remaining === 1 ? "" : "s"}
        </Link>
      )}
    </>
  )
}

export const OVERVIEW_ICONS = { activity: Activity, health: HeartPulse, documents: FileText, members: Users }
