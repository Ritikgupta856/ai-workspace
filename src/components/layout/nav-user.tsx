"use client"

import { Suspense, useEffect, useState } from "react"
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
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronsUpDown,
  Settings,
  LogOut,
} from "lucide-react"
import { signOut } from "@/lib/auth-client"
import { ThemeSubmenu } from "@/components/common/theme-menu"
import { SettingsDialog, type Section } from "@/components/settings/settings-dialog"

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
function SettingsQuerySync({
  onSection,
}: {
  onSection: (section: Section) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const settings = searchParams.get("settings")
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (!settings && !success && !error) return

    if (settings && (VALID_SECTIONS as string[]).includes(settings)) {
      onSection(settings as Section)
    }
    if (success) toast.success("Connected successfully.")
    if (error) {
      toast.error(
        INTEGRATION_ERRORS[error] ??
          (error.endsWith("_denied") ? "Authorization was denied." : "Failed to connect integration. Please try again.")
      )
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<Section | undefined>(undefined)

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
              <DropdownMenuItem
                onSelect={(e) => {
                  // Opening a Dialog synchronously from a DropdownMenuItem races
                  // Radix's own close cleanup and can leave `pointer-events: none`
                  // stuck on <body> — deferring a tick lets the menu finish closing
                  // first, which is the documented workaround for that bug.
                  e.preventDefault()
                  setTimeout(() => setSettingsOpen(true), 0)
                }}
              >
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
        <SettingsQuerySync
          onSection={(section) => {
            setSettingsSection(section)
            setSettingsOpen(true)
          }}
        />
      </Suspense>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </SidebarMenu>
  )
}
