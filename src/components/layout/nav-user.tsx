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
  useSidebar,
} from "@/components/ui/sidebar"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronsUpDown,
  Settings,
  LogOut,
} from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { ThemeSubmenu } from "@/components/common/theme-menu"
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

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const slug = useParams().slug as string

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2).toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.slice(0, 2).toUpperCase() || "CN"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => router.push(`/${slug}/settings`)}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <ThemeSubmenu />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut().then(() => { router.push("/") })}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Suspense fallback={null}>
        <SettingsQuerySync />
      </Suspense>
    </SidebarMenu>
  )
}
