"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bot,
  Home,
  Inbox,
  CircleCheck,
  ChevronsUpDown,
  ChevronRight,
  Plus,
  Star,
  FileText,
  Frame,
  LayoutPanelTop,
  PanelLeft,
  Check,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react"

import { NavUser } from "@/components/layout/nav-user"
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { ProjectDialog } from "@/components/projects/create-project-dialog"
import type { ProjectCardData } from "@/components/projects/project-card"
import type { MemberRoleKey } from "@/lib/constants"
import { signOut } from "@/lib/auth-client"
import type { SidebarData, SidebarFavorite, SidebarProject } from "@/lib/sidebar-data"
import { useSidebarData } from "@/lib/query/sidebar"
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
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  /** Projects, favorites and unread count, also resolved on the server. */
  initialData: SidebarData
  /** Current workspace's slug — every internal link/push is prefixed with it. */
  slug: string
}

/** Places you return to — never individual records. */
const flatNavItems: {
  title: string
  url: string
  icon: LucideIcon
  badgeKey: "inbox" | null
}[] = [
  { title: "Home", url: "", icon: Home, badgeKey: null },
  { title: "Agent", url: "/agent", icon: Bot, badgeKey: null },
  { title: "Inbox", url: "/inbox", icon: Inbox, badgeKey: "inbox" },
  { title: "My Tasks", url: "/my-work", icon: CircleCheck, badgeKey: null },
]

const FAVORITE_ICONS: Record<SidebarFavorite["entityType"], typeof FileText> = {
  PAGE: FileText,
  WHITEBOARD: Frame,
  TASK: CircleCheck,
  PROJECT: LayoutPanelTop,
}

// Workspace marks cycle through the reference's gradients, stable per id.
const WORKSPACE_GRADIENTS = [
  "from-blue-500 to-purple-500",
  "from-indigo-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
]

function workspaceGradient(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return WORKSPACE_GRADIENTS[hash % WORKSPACE_GRADIENTS.length]
}

/** Filled triangle next to section titles; points right when collapsed. */
function SectionChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("size-4 fill-current transition-transform duration-200", !open && "-rotate-90")}
    >
      <path d="M7 10l5 5 5-5z" />
    </svg>
  )
}

const ROW =
  "h-[30px] gap-[9px] rounded-md px-2 py-0 text-[13px] font-medium leading-5 whitespace-nowrap transition-colors [&>svg]:size-4 [&>svg]:text-muted-foreground"
const ROW_ACTIVE = "bg-accent font-[550] text-foreground"
const ROW_IDLE = "text-foreground/80 hover:bg-accent"

const projectSubLinks = (counts: Pick<SidebarProject, "taskCount" | "pageCount" | "whiteboardCount">) => [
  { label: "Overview", tab: "overview", icon: LayoutPanelTop, count: null as number | null },
  { label: "Tasks", tab: "tasks", icon: CircleCheck, count: counts.taskCount },
  { label: "Pages", tab: "pages", icon: FileText, count: counts.pageCount },
  { label: "White Board", tab: "board", icon: Frame, count: counts.whiteboardCount },
]

const FAVORITES_VISIBLE = 7
const PROJECTS_VISIBLE = 5

export function AppSidebar({
  user,
  workspaces,
  activeWorkspaceId,
  initialData,
  slug,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const base = `/${slug}`

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [createProjectOpen, setCreateProjectOpen] = React.useState(false)
  const [showAllFavorites, setShowAllFavorites] = React.useState(false)
  const [openProjectId, setOpenProjectId] = React.useState<string | null>(null)
  const [favoritesOpen, setFavoritesOpen] = React.useState(true)

  // Starts from what the server rendered, then stays current through query
  // invalidation: whatever changes projects, favourites or unread
  // notifications invalidates it. Keyed by workspace, so a switch can't show
  // another workspace's data.
  const { projects, favorites, unreadCount } = useSidebarData(slug, activeWorkspaceId, initialData)

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  // Home lives at the workspace root, which is a prefix of every other route,
  // so it only counts as active on an exact match.
  const isActive = (url: string) => (url === base ? pathname === url : pathname.startsWith(url))

  // The project the user is currently looking at always stays open — a
  // collapse elsewhere shouldn't hide the row they're actively reading.
  const relativePath = pathname.startsWith(base) ? pathname.slice(base.length) : pathname
  const currentProjectId = relativePath.match(/^\/projects\/([^/]+)/)?.[1] ?? null
  React.useEffect(() => {
    if (currentProjectId) setOpenProjectId(currentProjectId)
  }, [currentProjectId])

  // Derived, not stored: the server already decided which workspace is active,
  // so holding a copy in state would only let the two drift apart.
  const active =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null

  const activeTeam = active ? { id: active.id, name: active.name } : null

  const handleSwitchWorkspace = async (w: WorkspaceItem) => {
    if (w.id === activeWorkspaceId) return
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: w.id }),
      })
      if (res.ok) {
        // A real navigation, not a soft refresh — the URL itself carries the
        // workspace now, so switching has to actually go there.
        router.push(`/${w.slug}/agent`)
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
      className="[&_[data-sidebar=sidebar]]:bg-sidebar border-r border-border"
      {...props}
    >
      {/* ── Header: workspace switcher + collapse toggle (48px); collapsed, the toggle takes the switcher's place ── */}
      <SidebarHeader className="h-12 flex-row items-center gap-1 p-2">
        {activeTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="h-8 min-w-0 flex-1 gap-2 rounded-md p-2 data-[state=open]:bg-accent group-data-[collapsible=icon]:hidden"
              >
                <span
                  className={cn("size-4 shrink-0 rounded bg-gradient-to-tr", workspaceGradient(activeTeam.id))}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-foreground">
                  {activeTeam.name}
                </span>
                <ChevronsUpDown className="size-2 shrink-0 text-foreground/70" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="bottom"
              align="start"
              sideOffset={4}
              className="w-48 rounded-[10px] p-2 pt-3 shadow-xl"
            >
              <DropdownMenuLabel className="px-2 py-0 text-xs font-medium text-muted-foreground">
                Switch workspace:
              </DropdownMenuLabel>
              <div className="mt-3 flex flex-col gap-1">
                {workspaces.map((team) => {
                  const current = activeTeam.id === team.id
                  return (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => handleSwitchWorkspace(team)}
                      className={cn(
                        "h-7 cursor-pointer gap-2.5 rounded-lg p-1.5 text-sm leading-5",
                        current && "bg-accent"
                      )}
                    >
                      <span className={cn("size-4 shrink-0 rounded bg-gradient-to-tr", workspaceGradient(team.id))} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          current ? "font-medium text-foreground" : "text-foreground/80"
                        )}
                      >
                        {team.name}
                      </span>
                      {current && <Check className="size-4 shrink-0 text-green-600" />}
                    </DropdownMenuItem>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <DropdownMenuItem
                  onClick={() => setCreateDialogOpen(true)}
                  className="h-7 cursor-pointer gap-2 rounded-md py-1.5 pr-2.5 pl-2 text-sm text-foreground/80"
                >
                  <Plus className="size-4 text-muted-foreground" />
                  New workspace
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`${pathname}?settings=workspace`)}
                  className="h-7 cursor-pointer gap-2 rounded-md py-1.5 pr-2.5 pl-2 text-sm text-foreground/80"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Quick settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut().then(() => router.push("/"))}
                  className="h-7 cursor-pointer gap-2 rounded-md py-1.5 pr-2.5 pl-2 text-sm text-foreground/80"
                >
                  <LogOut className="size-4 text-muted-foreground" />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border"
        >
          <PanelLeft className="size-4" />
        </button>
      </SidebarHeader>

      {/* ── Links: nav · sections, 20px apart ── */}
      <SidebarContent className="gap-5 px-2 pt-3 pb-2">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0">
            {flatNavItems.map((item) => {
              const href = `${base}${item.url}`
              const active = isActive(href)
              const badge = item.badgeKey === "inbox" && unreadCount > 0 ? unreadCount : null

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
                  >
                    <Link
                      href={href}
                      prefetch
                      onMouseEnter={() => prefetchRoute(href)}
                      onFocus={() => prefetchRoute(href)}
                    >
                      <item.icon />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badge !== null && (
                    <SidebarMenuBadge className="top-[5px] h-5 min-w-5 text-[11px] text-muted-foreground">
                      {badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Favorites — hidden entirely when empty, no empty state ── */}
        {favorites.length > 0 && (
          <Collapsible open={favoritesOpen} onOpenChange={setFavoritesOpen} asChild>
            <SidebarGroup className="gap-2 p-0 group-data-[collapsible=icon]:hidden">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  asChild
                  className="h-auto cursor-pointer gap-1.5 rounded-none px-1.5 pb-[3px] text-2xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground/80"
                >
                  <button type="button">
                    Favorites
                    <SectionChevron open={favoritesOpen} />
                  </button>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="gap-0">
                  {visibleFavorites.map((fav) => {
                    const Icon = FAVORITE_ICONS[fav.entityType]
                    const active = pathname.startsWith(fav.href)
                    return (
                      <SidebarMenuItem key={fav.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={fav.name}
                          className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
                        >
                          <Link href={fav.href} prefetch>
                            {fav.entityType === "PROJECT" ? (
                              <span className="flex size-4 shrink-0 items-center justify-center">
                                <span className="text-[13px] leading-none">{fav.icon || "📁"}</span>
                              </span>
                            ) : (
                              <Icon />
                            )}
                            <span className="min-w-0 flex-1 truncate">{fav.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                  {!showAllFavorites && favorites.length > FAVORITES_VISIBLE && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setShowAllFavorites(true)}
                        className="h-7 rounded-md pl-1.5 text-xs text-muted-foreground"
                      >
                        Show more
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* ── Projects — always open; the title links to the full list ── */}
        <SidebarGroup className="relative gap-2 p-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel
            asChild
            className={cn(
              "h-auto gap-1.5 rounded-none px-1.5 pb-[3px] text-2xs font-semibold tracking-wider uppercase hover:text-foreground/80",
              pathname === `${base}/projects` ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Link href={`${base}/projects`} prefetch onMouseEnter={() => prefetchRoute(`${base}/projects`)}>
              Projects
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupAction
            onClick={() => setCreateProjectOpen(true)}
            title="New project"
            className="top-0 right-1 size-4 text-muted-foreground hover:text-foreground [&>svg]:size-3.5"
          >
            <Plus />
          </SidebarGroupAction>
            <SidebarMenu className="gap-0">
              {visibleProjects.map((project) => {
                const href = `${base}/projects/${project.id}`
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
                          className={cn(ROW, "group/project cursor-pointer", active && !isOpen ? ROW_ACTIVE : ROW_IDLE)}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            <span className="text-[13px] leading-none">{project.icon || "📁"}</span>
                          </span>
                          <span className="min-w-0 flex-1 truncate">{project.name}</span>
                          {favorited && (
                            <Star className="!size-[11px] shrink-0 fill-current !text-muted-foreground/60 group-hover/project:hidden" />
                          )}
                          {/* Expand/collapse hint: right edge, hover-only; points down while open. */}
                          <ChevronRight
                            className={cn(
                              "!size-3 shrink-0 text-muted-foreground/70 opacity-0 transition-[opacity,transform] duration-150 group-hover/project:opacity-100",
                              isOpen && "rotate-90"
                            )}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub className="mx-2.5 gap-0 pr-0">
                          {projectSubLinks(project).map((link) => {
                            const linkHref = `${href}/${link.tab}`
                            const isLinkActive = pathname === linkHref || pathname.startsWith(`${linkHref}/`)
                            return (
                              <SidebarMenuSubItem key={link.tab}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isLinkActive}
                                  className={cn(
                                    "h-[30px] gap-[9px] rounded-md px-2 text-[13px] font-medium [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
                                    isLinkActive ? "bg-accent font-[550] text-foreground" : "text-foreground/80"
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
                  <SidebarMenuButton asChild className="h-7 rounded-md pl-1.5 text-xs text-muted-foreground">
                    <Link href={`${base}/projects`} prefetch>
                      All projects ({projects.length})
                      <ChevronRight className="ml-auto size-3" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-2 pt-0">
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
          router.push(`${base}/projects/${project.id}/overview`)
        }}
      />

    </Sidebar>
  )
}
