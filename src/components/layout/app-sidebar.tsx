"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Inbox,
  CircleCheck,
  Sparkles,
  ChevronsUpDown,
  ChevronRight,
  Plus,
  Star,
  FileText,
  Frame,
  LayoutPanelTop,
} from "lucide-react"

import { NavUser } from "@/components/layout/nav-user"
import { SearchCommand } from "@/components/layout/search-command"
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface WorkspaceItem {
  id: string
  name: string
  slug: string
  role: MemberRoleKey
}

export interface AppSidebarProps {
  user: {
    name: string
    email: string
    avatar: string
  }
  /** Resolved on the server so the switcher paints with the first frame. */
  workspaces: WorkspaceItem[]
  activeWorkspaceId: string | null
}

/** Places you return to — never individual records. */
const flatNavItems = [
  { title: "Home", url: "/home", icon: Home, badgeKey: null },
  { title: "Inbox", url: "/inbox", icon: Inbox, badgeKey: "inbox" as const },
  { title: "My work", url: "/my-work", icon: CircleCheck, badgeKey: null },
  { title: "Agent", url: "/agent", icon: Sparkles, badgeKey: null },
]

type FavoriteItem = {
  id: string
  entityType: "PROJECT" | "TASK" | "NOTE" | "WHITEBOARD" | "PAGE"
  entityId: string
  name: string
  href: string
}

const FAVORITE_ICONS: Record<FavoriteItem["entityType"], typeof FileText> = {
  NOTE: FileText,
  PAGE: FileText,
  WHITEBOARD: Frame,
  TASK: CircleCheck,
  PROJECT: LayoutPanelTop,
}

type ProjectItem = {
  id: string
  name: string
  icon: string | null
  taskCount: number
  pageCount: number
  whiteboardCount: number
}

const PROJECT_DOT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-cyan-500",
]

function projectDotColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_DOT_COLORS[hash % PROJECT_DOT_COLORS.length]
}

const projectSubLinks = (counts: Pick<ProjectItem, "taskCount" | "pageCount" | "whiteboardCount">) => [
  { label: "Overview", tab: "overview", icon: LayoutPanelTop, count: null as number | null },
  { label: "Tasks", tab: "tasks", icon: CircleCheck, count: counts.taskCount },
  { label: "Pages", tab: "pages", icon: FileText, count: counts.pageCount },
  { label: "Board", tab: "board", icon: Frame, count: counts.whiteboardCount },
]

const FAVORITES_VISIBLE = 7
const PROJECTS_VISIBLE = 5

export function AppSidebar({
  user,
  workspaces,
  activeWorkspaceId,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>([])
  const [showAllFavorites, setShowAllFavorites] = React.useState(false)
  const [projects, setProjects] = React.useState<ProjectItem[]>([])
  const [openProjectId, setOpenProjectId] = React.useState<string | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  const isActive = (url: string) => {
    if (url === "/home") return pathname === "/home"
    return pathname.startsWith(url)
  }

  const loadProjects = React.useCallback(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          type ApiProject = {
            id: string
            name: string
            icon: string | null
            taskCount: number
            pageCount: number
            whiteboardCount: number
          }
          setProjects(
            (json.projects as ApiProject[]).map((p) => ({
              id: p.id,
              name: p.name,
              icon: p.icon,
              taskCount: p.taskCount,
              pageCount: p.pageCount,
              whiteboardCount: p.whiteboardCount,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setFavorites(json.favorites)
      })
      .catch(() => {})

    loadProjects()

    fetch("/api/notifications?view=unread")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setUnreadCount(json.unreadCount)
      })
      .catch(() => {})
  }, [pathname, loadProjects])

  // The project the user is currently looking at always stays open — a
  // collapse elsewhere shouldn't hide the row they're actively reading.
  const currentProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null
  React.useEffect(() => {
    if (currentProjectId) setOpenProjectId(currentProjectId)
  }, [currentProjectId])

  // Derived, not stored: the server already decided which workspace is active,
  // so holding a copy in state would only let the two drift apart.
  const active =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null

  const activeTeam = active
    ? {
        id: active.id,
        name: active.name,
        abbr: active.name.charAt(0).toUpperCase(),
        plan: MEMBER_ROLE_CONFIG[active.role]?.label || "Member",
      }
    : null

  const handleSwitchWorkspace = async (w: WorkspaceItem) => {
    if (w.id === activeWorkspaceId) return
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: w.id }),
      })
      if (res.ok) {
        // Re-renders the server tree with the new cookie instead of a full
        // document reload, so the switch doesn't blank the page.
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to switch workspace:", err)
    }
  }

  const prefetchRoute = React.useCallback(
    (url: string) => {
      router.prefetch(url)
    },
    [router]
  )

  const favoritedProjectIds = React.useMemo(
    () =>
      new Set(
        favorites.filter((f) => f.entityType === "PROJECT").map((f) => f.entityId)
      ),
    [favorites]
  )

  // Favorited projects first, then the rest in the order the API already
  // returns them (most recently updated) — a stand-in for "recent activity"
  // until per-user activity ranking exists. The open project is pinned in
  // regardless of where it'd otherwise land.
  const visibleProjects = React.useMemo(() => {
    const ranked = [...projects].sort((a, b) => {
      const af = favoritedProjectIds.has(a.id)
      const bf = favoritedProjectIds.has(b.id)
      return af === bf ? 0 : af ? -1 : 1
    })
    let visible = ranked.slice(0, PROJECTS_VISIBLE)
    if (currentProjectId && !visible.some((p) => p.id === currentProjectId)) {
      const current = ranked.find((p) => p.id === currentProjectId)
      if (current) visible = [...visible.slice(0, PROJECTS_VISIBLE - 1), current]
    }
    return visible
  }, [projects, favoritedProjectIds, currentProjectId])

  const visibleFavorites = showAllFavorites
    ? favorites
    : favorites.slice(0, FAVORITES_VISIBLE)

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-sidebar=sidebar]]:bg-white border-r border-border text-sm"
      {...props}
    >
      {/* ── Header ── */}
      <SidebarHeader className="gap-2 px-2 py-2">
        {activeTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground gap-2"
              >
                <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  {activeTeam.abbr}
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">{activeTeam.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{activeTeam.plan}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-56 rounded-lg">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
              {workspaces.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleSwitchWorkspace(team)}
                  className={cn(
                    "gap-2 p-2 cursor-pointer",
                    activeTeam.id === team.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {MEMBER_ROLE_CONFIG[team.role]?.label || "Member"}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setCreateDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-3.5" />
                </div>
                <span className="text-[13px] text-muted-foreground font-medium">Create workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Hidden in icon-collapsed mode along with Favorites and Projects —
            collapsed rail shows only the 4 top-level icons + avatar. */}
        <div className="group-data-[collapsible=icon]:hidden">
          <SearchCommand />
        </div>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="px-2 py-1">
        <SidebarGroup className="px-0 py-1">
          <SidebarMenu className="gap-0.5">
            {flatNavItems.map((item) => {
              const active = isActive(item.url)
              const badge = item.badgeKey === "inbox" && unreadCount > 0 ? unreadCount : null

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={cn(
                      "h-8 rounded-md text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-foreground/80 font-normal hover:bg-accent/50"
                    )}
                  >
                    <Link
                      href={item.url}
                      prefetch
                      onMouseEnter={() => prefetchRoute(item.url)}
                      onFocus={() => prefetchRoute(item.url)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badge !== null && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Favorites — hidden entirely when empty, no empty state ── */}
        {favorites.length > 0 && (
          <SidebarGroup className="px-0 py-1 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Favorites</SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {visibleFavorites.map((fav) => {
                const Icon = FAVORITE_ICONS[fav.entityType]
                const active = pathname.startsWith(fav.href)
                return (
                  <SidebarMenuItem key={fav.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={fav.name}
                      className={cn(
                        "h-8 rounded-md text-sm transition-colors",
                        active
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-foreground/80 font-normal hover:bg-accent/50"
                      )}
                    >
                      <Link href={fav.href} prefetch>
                        {fav.entityType === "PROJECT" ? (
                          <span className={cn("size-[7px] shrink-0 rounded-full", projectDotColor(fav.entityId))} />
                        ) : (
                          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{fav.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              {!showAllFavorites && favorites.length > FAVORITES_VISIBLE && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowAllFavorites(true)}
                    className="h-7 rounded-md text-xs text-muted-foreground"
                  >
                    Show more
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* ── Projects — favorited first, currently-open project pinned in ── */}
        <SidebarGroup className="relative px-0 py-1 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupAction onClick={() => setCreateProjectOpen(true)} title="New project">
            <Plus />
          </SidebarGroupAction>
          <SidebarMenu className="gap-0.5">
            {visibleProjects.map((project) => {
              const href = `/projects/${project.id}`
              const active = pathname.startsWith(href)
              const isOpen = openProjectId === project.id
              const favorited = favoritedProjectIds.has(project.id)

              return (
                <Collapsible
                  key={project.id}
                  open={isOpen}
                  onOpenChange={(next) => setOpenProjectId(next ? project.id : null)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={active && !isOpen}
                        tooltip={project.name}
                        className={cn(
                          "h-8 cursor-pointer rounded-md text-sm transition-colors",
                          active && !isOpen
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "text-foreground/80 font-normal hover:bg-accent/50"
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            "size-3 shrink-0 text-muted-foreground/70 transition-transform duration-150",
                            isOpen && "rotate-90"
                          )}
                        />
                        <span className={cn("size-[7px] shrink-0 rounded-full", projectDotColor(project.id))} />
                        <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                        {favorited && (
                          <Star className="size-[11px] shrink-0 fill-current text-muted-foreground/60" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {projectSubLinks(project).map((link) => {
                          const linkHref = `${href}/${link.tab}`
                          const isLinkActive = pathname === linkHref || pathname.startsWith(`${linkHref}/`)
                          return (
                            <SidebarMenuSubItem key={link.tab}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isLinkActive}
                                className={cn(
                                  "[&>svg]:size-[13px]",
                                  isLinkActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                              >
                                <Link href={linkHref} prefetch onMouseEnter={() => prefetchRoute(linkHref)}>
                                  <link.icon />
                                  <span className="truncate">{link.label}</span>
                                  {link.count !== null && link.count > 0 && (
                                    <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
                                      {link.count}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}

            {projects.length > PROJECTS_VISIBLE && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-7 rounded-md text-xs text-muted-foreground">
                  <Link href="/projects" prefetch>
                    All projects ({projects.length})
                    <ChevronRight className="ml-auto size-3" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 py-2">
        <NavUser user={resolvedUser} />
      </SidebarFooter>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          // The list comes from the server tree, so re-render it rather than
          // refetching into local state.
          router.refresh()
        }}
      />

      <ProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        mode="create"
        onSuccess={(project: ProjectCardData) => {
          loadProjects()
          router.push(`/projects/${project.id}/overview`)
        }}
      />

    </Sidebar>
  )
}
