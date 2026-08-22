"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Bot,
  FolderOpen,
  CheckSquare,
  FileText,
  Puzzle,
  Users,
  Settings,
  ChevronsUpDown,
  PenTool,
  Plus,
} from "lucide-react"

import { NavUser } from "@/components/layout/nav-user"
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { MEMBER_ROLE_CONFIG, type MemberRoleKey } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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

/** Grouped so the list reads as sections rather than one long column. */
const navSections = [
  {
    label: null,
    items: [
      { title: "Home", url: "/home", icon: Home },
      { title: "Agent", url: "/agent", icon: Bot },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Projects", url: "/projects", icon: FolderOpen },
      { title: "Tasks", url: "/tasks", icon: CheckSquare },
      { title: "Notes", url: "/notes", icon: FileText },
      { title: "Boards", url: "/boards", icon: PenTool },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Integrations", url: "/integrations", icon: Puzzle },
      { title: "Members", url: "/members", icon: Users },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({
  user,
  workspaces,
  activeWorkspaceId,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  const isActive = (url: string) => {
    if (url === "/home") return pathname === "/home"
    return pathname.startsWith(url)
  }

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

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Logo ── */}
      <SidebarHeader className="py-3">
        {activeTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[12px] font-bold">
                  {activeTeam.abbr}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{activeTeam.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{activeTeam.plan}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
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
                    activeTeam.id === team.id && "bg-sidebar-accent text-sidebar-accent-foreground"
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
      </SidebarHeader >

      {/* ── Main nav ── */}
      <SidebarContent className="px-2">
        {navSections.map((section, i) => (
          <SidebarGroup key={section.label ?? `group-${i}`} className="px-0 py-1">
            {section.label && !isCollapsed && (
              <p className="text-muted-foreground/70 px-3 pt-2 pb-1.5 text-[11px] font-medium">
                {section.label}
              </p>
            )}
            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "h-9 rounded-lg text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Link
                        href={item.url}
                        prefetch
                        onMouseEnter={() => prefetchRoute(item.url)}
                        onFocus={() => prefetchRoute(item.url)}
                      >
                        <item.icon
                          className={cn("size-4", active && "text-primary")}
                          strokeWidth={active ? 2.25 : 2}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-2">
        <NavUser user={resolvedUser} />
      </SidebarFooter>

      <SidebarRail />

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          // The list comes from the server tree, so re-render it rather than
          // refetching into local state.
          router.refresh()
        }}
      />
    </Sidebar >
  )
}
