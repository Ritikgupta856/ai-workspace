"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ClipboardCheck,
  Database,
  MoreHorizontal,
  LayoutPanelTop,
  FileText,
  Frame,
  CirclePlus,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials, type ProjectTeamMember } from "@/components/projects/project-card"

const MAX_AVATARS = 6

/** Every section of a project. The `···` menu lists the ones you're not on. */
export const PROJECT_SECTIONS = [
  { label: "Overview", tab: "overview", icon: LayoutPanelTop },
  { label: "Tasks", tab: "tasks", icon: ClipboardCheck },
  { label: "Pages", tab: "pages", icon: FileText },
  { label: "Board", tab: "board", icon: Frame },
] as const

export type ProjectSectionTab = (typeof PROJECT_SECTIONS)[number]["tab"]

export interface ProjectSectionHeaderProps {
  section: ProjectSectionTab
  projectId: string
  projectName: string
  projectIcon?: string | null
  members: ProjectTeamMember[]
  /** The black primary button on the right. */
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  /**
   * Extra controls rendered before the primary action. View switching and
   * search deliberately do not live here — each section's own toolbar owns
   * them, and offering them twice meant two controls that looked alike but
   * drove different state.
   */
  children?: React.ReactNode
}

/**
 * Top bar shared by the project's Tasks / Pages / Board routes: breadcrumb on
 * the left, team avatars and the primary actions on the right. Sits above
 * each section's own toolbar.
 */
export function ProjectSectionHeader({
  section,
  projectId,
  projectName,
  projectIcon,
  members,
  action,
  children,
}: ProjectSectionHeaderProps) {
  const slug = useParams().slug as string
  const current = PROJECT_SECTIONS.find((s) => s.tab === section) ?? PROJECT_SECTIONS[0]
  const CurrentIcon = current.icon
  const others = PROJECT_SECTIONS.filter((s) => s.tab !== section)
  const visible = members.slice(0, MAX_AVATARS)
  const remaining = members.length - visible.length

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
      {/* Breadcrumb: project first, then the section within it — the trail
          should read outside-in, and the project is what stays the same as you
          move between Overview, Tasks, Pages and Board. */}
      <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link
          href={`/${slug}/projects/${projectId}/overview`}
          className="inline-flex min-w-0 items-center gap-2 rounded px-1 py-0.5 text-foreground transition-colors hover:bg-accent"
        >
          {projectIcon ? (
            <span className="text-sm leading-none">{projectIcon}</span>
          ) : (
            <Database className="size-3.5 text-muted-foreground" />
          )}
          <span className="truncate font-medium">{projectName}</span>
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <span className="inline-flex shrink-0 items-center gap-2 text-foreground">
          <CurrentIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{current.label}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Project sections"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Go to
            </DropdownMenuLabel>
            {others.map((s) => (
              <DropdownMenuItem key={s.tab} asChild>
                <Link href={`/${slug}/projects/${projectId}/${s.tab}`}>
                  <s.icon className="size-4" />
                  {s.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2.5">
        {visible.length > 0 && (
          <div className="hidden items-center -space-x-2 md:flex">
            {visible.map((m) => (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <Avatar className="size-5.5 ring-2 ring-background">
                    <AvatarImage src={m.image ?? undefined} alt={m.name} />
                    <AvatarFallback className="bg-muted text-[8px] font-semibold text-foreground">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{m.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {remaining > 0 && (
              <span className="flex size-5.5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-2 ring-background">
                +{remaining}
              </span>
            )}
          </div>
        )}

        {visible.length > 0 && <span className="hidden h-4 w-px bg-border md:block" />}

        {children}

        {action && (
          <Button
            size="sm"
            onClick={action.onClick}
            disabled={action.loading}
            className="h-8 gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-background hover:bg-foreground/90"
          >
            {action.loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CirclePlus className="size-3.5" />
            )}
            {action.label}
          </Button>
        )}
      </div>
    </header>
  )
}
