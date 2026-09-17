import * as React from "react"
import { CirclePlus, Loader2, Search, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * 48px page header for workspace-level pages (Inbox, My work): an icon +
 * title on the left, compact actions on the right. Same bar the project
 * sections use, minus the project breadcrumb.
 */
export function SectionHeader({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: LucideIcon
  title: string
  /** Small chip after the title, e.g. unread count. */
  count?: number | null
  children?: React.ReactNode
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="truncate font-medium text-foreground">{title}</span>
        {count != null && count > 0 && (
          <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded border border-border/80 bg-card px-1 font-mono text-[10px] leading-none text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2.5">{children}</div>}
    </header>
  )
}

/** Outlined 32px header button ("Search", "Mark all read"). */
export function HeaderButton({
  icon: Icon,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { icon?: LucideIcon }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("h-8 gap-1.5 rounded-lg border-border/80 px-3 text-[13px] font-medium shadow-none", className)}
      {...props}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </Button>
  )
}

export function HeaderSearchButton(props: Omit<React.ComponentProps<typeof Button>, "children">) {
  return (
    <HeaderButton icon={Search} {...props}>
      Search
    </HeaderButton>
  )
}

/** The black primary header button ("Add"). */
export function HeaderPrimaryButton({
  loading,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button
      size="sm"
      disabled={loading || props.disabled}
      className={cn(
        "h-8 gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-medium text-background hover:bg-foreground/90",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CirclePlus className="size-3.5" />}
      {children}
    </Button>
  )
}
