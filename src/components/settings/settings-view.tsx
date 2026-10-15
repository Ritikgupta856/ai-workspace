"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  CreditCard,
  Building2,
  Puzzle,
  Settings as SettingsIcon,
  SlidersHorizontal,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { SectionHeader } from "@/components/dashboard/section-header"
import { SettingsPanelSkeleton } from "@/components/dashboard/loading-states"
import { ThemeToggle } from "@/components/common/theme-menu"
import { SearchCommand } from "@/components/layout/search-command"
import { IntegrationsPanel } from "@/components/integrations/integrations-panel"
import { MembersPanel } from "@/components/members/members-panel"
import {
  BillingPanel,
  PreferencesPanel,
  ProfilePanel,
  WorkspacePanel,
  type Section,
} from "@/components/settings/settings-panels"
import { useInvalidateSettings, useSettings } from "@/lib/query/settings"
import { cn } from "@/lib/utils"

const GROUPS: { heading: string; items: { id: Section; label: string; icon: LucideIcon }[] }[] = [
  {
    heading: "General",
    items: [{ id: "workspace", label: "Workspace", icon: Building2 }],
  },
  {
    heading: "Personal",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { id: "members", label: "Members", icon: Users },
      { id: "integrations", label: "Integrations", icon: Puzzle },
    ],
  },
  {
    heading: "Billing",
    items: [{ id: "billing", label: "Plan", icon: CreditCard }],
  },
]

const SECTION_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id))

export function SettingsView() {
  const router = useRouter()
  const slug = useParams().slug as string
  const searchParams = useSearchParams()

  const requested = searchParams.get("section")
  const section: Section = SECTION_IDS.includes(requested as Section) ? (requested as Section) : "workspace"

  const { data, isPending: loading, error } = useSettings(true)
  const reload = useInvalidateSettings()

  React.useEffect(() => {
    if (error) toast.error(error.message || "Failed to load settings")
  }, [error])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SectionHeader icon={SettingsIcon} title="Settings">
        <SearchCommand variant="header" />
        <ThemeToggle />
      </SectionHeader>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="shrink-0 overflow-y-auto border-b border-border/70 px-3 py-4 md:w-56 md:border-r md:border-b-0">
          <nav className="flex gap-4 overflow-x-auto md:flex-col md:gap-6" aria-label="Settings sections">
            {GROUPS.map((group) => (
              <div key={group.heading} className="flex shrink-0 flex-col gap-1">
                <p className="px-2.5 pb-1 text-2xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {group.heading}
                </p>
                {group.items.map((item) => {
                  const active = section === item.id
                  return (
                    <Link
                      key={item.id}
                      href={`/${slug}/settings?section=${item.id}`}
                      replace
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-lg border px-2.5 text-[13px] transition-colors [&>svg]:size-4",
                        active
                          ? "border-border/70 bg-card font-medium text-foreground shadow-xs [&>svg]:text-foreground"
                          : "border-transparent text-foreground/80 hover:bg-foreground/5 [&>svg]:text-muted-foreground"
                      )}
                    >
                      <item.icon />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8 md:px-12">
          {/* Members is a table, so it gets the full width; the form panels stay readable at 2xl. */}
          <div className={cn(section !== "members" && "max-w-2xl")}>
            {loading || !data ? (
              <SettingsPanelSkeleton />
            ) : section === "profile" ? (
              <ProfilePanel profile={data.profile} onSaved={reload} />
            ) : section === "workspace" ? (
              <WorkspacePanel
                workspace={data.workspace}
                role={data.role}
                onSaved={reload}
                onDeleted={(nextSlug) => {
                  router.push(nextSlug ? `/${nextSlug}` : "/")
                  router.refresh()
                }}
              />
            ) : section === "members" ? (
              <MembersPanel />
            ) : section === "integrations" ? (
              <IntegrationsPanel />
            ) : section === "preferences" ? (
              <PreferencesPanel />
            ) : (
              <BillingPanel workspace={data.workspace} role={data.role} subscription={data.subscription} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
