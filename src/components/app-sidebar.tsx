"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HouseIcon, ChatCircleDotsIcon, CheckSquareIcon, LightningIcon, BrainIcon, GearIcon } from "@phosphor-icons/react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Home",        url: "/home",                   icon: HouseIcon,          exact: true },
  { title: "Chat",        url: "/chat",                   icon: ChatCircleDotsIcon, exact: false },
  { title: "Tasks",       url: "/home/tasks",             icon: CheckSquareIcon,    exact: false },
  { title: "Automations", url: "/home/automations",       icon: LightningIcon,      exact: false },
  { title: "Knowledge",   url: "/home/knowledge",         icon: BrainIcon,          exact: false },
]

const bottomNavItems = [
  { title: "Settings", url: "/home/settings", icon: GearIcon },
]

type AppSidebarUser = {
  name: string
  email: string
  avatar: string
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: AppSidebarUser }) {
  const pathname = usePathname()

  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BrainIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Synapse</span>
                  <span className="truncate text-xs text-muted-foreground">AI Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.url
                : pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            {bottomNavItems.map((item) => {
              const isActive = pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
