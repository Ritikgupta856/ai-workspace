"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  MessageCircle,
  FolderOpen,
  CheckSquare,
  FileText,
  Puzzle,
  Users,
  Settings,
  ChevronsUpDown,
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
}

const navMain = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Members", url: "/members", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([])
  const [activeTeam, setActiveTeam] = React.useState<{ name: string; abbr: string; plan: string; id: string } | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  const isActive = (url: string) => {
    if (url === "/home") return pathname === "/home"
    return pathname.startsWith(url)
  }

  const loadWorkspaces = React.useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces")
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.workspaces) {
          const list: WorkspaceItem[] = data.workspaces
          setWorkspaces(list)

          // Determine active workspace from cookie
          const activeId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("activeWorkspaceId="))
            ?.split("=")[1]

          const active = list.find((w) => w.id === activeId) || list[0]
          if (active) {
            setActiveTeam({
              id: active.id,
              name: active.name,
              abbr: active.name.charAt(0).toUpperCase(),
              plan: MEMBER_ROLE_CONFIG[active.role]?.label || "Member",
            })
          }
        }
      }
    } catch (err) {
      console.error("Failed to load workspaces in sidebar:", err)
    }
  }, [])

  React.useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const handleSwitchWorkspace = async (w: WorkspaceItem) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: w.id }),
      })
      if (res.ok) {
        window.location.reload()
      }
    } catch (err) {
      console.error("Failed to switch workspace:", err)
    }
  }

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
      < SidebarContent className="px-2" >
        <SidebarGroup className="px-0 py-2">
          <SidebarMenu className="gap-1">
            {navMain.map((item) => {
              const active = isActive(item.url)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={
                      active
                        ? "h-10 rounded-lg font-medium text-sidebar-accent-foreground"
                        : "h-10 rounded-lg font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    }
                  >
                    <Link href={item.url}>
                      <item.icon
                        className={`size-4 ${active ? "text-primary" : ""
                          }`}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent >

      <SidebarFooter className="px-2 pb-2">
        <NavUser user={resolvedUser} />
      </SidebarFooter>

      <SidebarRail />

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          // Reload workspaces list after creation
          loadWorkspaces()
        }}
      />
    </Sidebar >
  )
}