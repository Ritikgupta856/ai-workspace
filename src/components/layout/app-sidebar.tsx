"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  MessageCircle,
  Search,
  FolderOpen,
  CheckSquare,
  ArrowLeftRight,
  Puzzle,
  Users,
  Settings,
  ChevronsUpDown,
  Plus,
} from "lucide-react"

import { NavUser } from "@/components/layout/nav-user"
import { MEMBER_ROLE_CONFIG } from "@/lib/constants"
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

const teams = [
  { name: "Synapse Labs", abbr: "S", plan: MEMBER_ROLE_CONFIG.OWNER.label },
  { name: "Personal", abbr: "P", plan: "Free Plan" },
]

const navMain = [
  { title: "Dashboard", url: "/home", icon: Home },
  { title: "Chats", url: "/chat", icon: MessageCircle },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Search", url: "/search", icon: Search },
  { title: "Workflows", url: "/workflows", icon: ArrowLeftRight },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Members", url: "/members", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
]

type AppSidebarUser = {
  name: string
  email: string
  avatar: string
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: AppSidebarUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  const isActive = (url: string) => {
    if (url === "/home") return pathname === "/home"
    return pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Logo ── */}
      <SidebarHeader className="px-3 py-3">
        <Link href="/home" className="flex h-8 items-center px-1">
          {isCollapsed ? (
            <Image src="/images/synapse-icon.svg" alt="Synapse" width={22} height={22} priority />
          ) : (
            <Image
              src="/images/synapse-logo.svg"
              alt="Synapse"
              width={120}
              height={60}
              priority
              className=""
            />
          )}
        </Link>

        {/* ── Workspace switcher ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mt-2"
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
            {teams.map((team) => (
              <DropdownMenuItem key={team.name} onClick={() => setActiveTeam(team)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
                  {team.abbr}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">{team.name}</span>
                  <span className="text-xs text-muted-foreground">{team.plan}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-3.5" />
              </div>
              <span className="text-[13px] text-muted-foreground font-medium">Create workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    </Sidebar >
  )
}