"use client"

import { Suspense, useEffect } from "react"
import { toast } from "sonner"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronsUpDown,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { ThemeSegmented } from "@/components/common/theme-menu"
import { getInitials } from "@/components/projects/project-card"
import type { Section } from "@/components/settings/settings-panels"

const INTEGRATION_ERRORS: Record<string, string> = {
  missing_params: "The provider did not return an authorization code.",
  invalid_state: "That authorization link expired. Try connecting again.",
  user_mismatch: "That authorization was started by a different account.",
  forbidden: "You are not a member of that workspace.",
  token_exchange_failed: "Could not exchange the authorization code for a token.",
  unknown_provider: "That integration is not supported.",
  provider_not_configured: "This provider's OAuth credentials are not configured on the server.",
}

const VALID_SECTIONS: Section[] = [
  "profile",
  "workspace",
  "members",
  "integrations",
  "preferences",
  "billing",
]

/** Reads ?settings=/&success=/&error= once per navigation and clears them. */
function SettingsQuerySync() {
  const router = useRouter()
  const slug = useParams().slug as string
  const searchParams = useSearchParams()

  useEffect(() => {
    const settings = searchParams.get("settings")
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (!settings && !success && !error) return

    if (success) toast.success("Connected successfully.")
    if (error) {
      toast.error(
        INTEGRATION_ERRORS[error] ??
          (error.endsWith("_denied") ? "Authorization was denied." : "Failed to connect integration. Please try again.")
      )
    }

    // Settings is a page now; old ?settings=<section> links land on it.
    if (settings && (VALID_SECTIONS as string[]).includes(settings)) {
      router.replace(`/${slug}/settings?section=${settings}`)
      return
    }

    const params = new URLSearchParams(searchParams)
    params.delete("settings")
    params.delete("success")
    params.delete("error")
    const rest = params.toString()
    router.replace(rest ? `${window.location.pathname}?${rest}` : window.location.pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}

type NavUserData = {
  name: string
  email: string
  avatar: string
}

const MENU_ITEM =
  "h-8 cursor-pointer gap-2.5 rounded-md px-2 text-sm text-foreground/90 [&_svg]:text-muted-foreground"

function UserAvatar({ user, className, online }: { user: NavUserData; className?: string; online?: boolean }) {
  return (
    <span className="relative shrink-0">
      <Avatar className={cn("size-6", className)}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
          {getInitials(user.name) || "U"}
        </AvatarFallback>
      </Avatar>
      {online && (
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
      )}
    </span>
  )
}

export function NavUser({ user }: { user: NavUserData }) {
  const router = useRouter()
  const slug = useParams().slug as string

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-9 gap-2.5 px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!p-1">
              <UserAvatar user={user} className="text-[10px]" online />
              <span className="min-w-0 flex-1 truncate font-medium">{user.name}</span>
              <ChevronsUpDown className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={6} className="w-60 rounded-xl p-0 shadow-lg">
            <DropdownMenuLabel className="flex items-center gap-3 p-3 font-normal">
              <UserAvatar user={user} className="size-9 text-sm" />
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuGroup className="p-1.5">
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => router.push(`/${slug}/settings?section=profile`)}>
                <User />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => router.push(`/${slug}/settings?section=preferences`)}>
                <Settings />
                Account settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-1.5">
              <DropdownMenuLabel className="px-2 pt-1 pb-1.5 text-[11px] font-semibold leading-4 tracking-wider text-muted-foreground uppercase">
                Theme
              </DropdownMenuLabel>
              <ThemeSegmented />
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuGroup className="p-1.5">
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => signOut().then(() => router.push("/"))}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Suspense fallback={null}>
        <SettingsQuerySync />
      </Suspense>
    </SidebarMenu>
  )
}
