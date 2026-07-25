"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Inbox, Loader2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { activityConfig } from "@/lib/constants/activity"
import { formatDateTime, formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { ActivityDTO } from "@/lib/activity"
import { fetchActivity, type ActivityScope } from "@/lib/api/activity"

/**
 * The one activity renderer. Three densities:
 *
 *   card     — dashboard/overview widget, fixed count, "View all" link
 *   list     — full-width feed with cursor pagination
 *   timeline — task detail, grouped by day with a connector rail
 *
 * They differ only in chrome; the row content and type vocabulary are shared,
 * which is what keeps the three surfaces from drifting apart again.
 */

type Variant = "card" | "list" | "timeline"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ActivitySentence({ item }: { item: ActivityDTO }) {
  // `description` already has the target folded in, so only append it when it
  // isn't part of the sentence — otherwise names render twice.
  const showTarget =
    item.target && !item.description.includes(item.target)

  return (
    <p className="text-sm leading-snug">
      <span className="font-medium">{item.user.name}</span>{" "}
      <span className="text-muted-foreground">{item.description}</span>
      {showTarget && <span className="font-medium"> {item.target}</span>}
    </p>
  )
}

function Row({ item, dense }: { item: ActivityDTO; dense?: boolean }) {
  const config = activityConfig(item.type)

  return (
    <div className={cn("flex items-start gap-3", dense ? "py-3" : "px-4 py-3")}>
      <Avatar className="mt-0.5 size-7 shrink-0">
        <AvatarImage src={item.user.image ?? undefined} alt={item.user.name} />
        <AvatarFallback className="text-[10px]">
          {initials(item.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <ActivitySentence item={item} />
        <p className="mt-0.5 text-xs text-muted-foreground">
          {dense ? formatUpdatedDate(item.createdAt) : formatDateTime(item.createdAt)}
        </p>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "shrink-0 px-2 py-0.5 text-[10px] font-medium",
          config.className
        )}
      >
        {config.label}
      </Badge>
    </div>
  )
}

function TimelineRow({ item, last }: { item: ActivityDTO; last: boolean }) {
  const config = activityConfig(item.type)
  const Icon = config.icon

  return (
    <div className={cn("relative flex gap-4", last ? "pb-0" : "pb-6")}>
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 items-start gap-3 pt-1">
        <Avatar className="size-6 shrink-0">
          <AvatarImage src={item.user.image ?? undefined} alt={item.user.name} />
          <AvatarFallback className="text-[10px]">
            {initials(item.user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <ActivitySentence item={item} />
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatUpdatedDate(item.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
        <Inbox className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export interface ActivityFeedProps {
  variant?: Variant
  /** Omit to fetch internally from the scope. */
  items?: ActivityDTO[]
  scope?: ActivityScope
  title?: string
  viewAllHref?: string
  emptyMessage?: string
  /** card variant only — how many rows to show. */
  limit?: number
}

export function ActivityFeed({
  variant = "list",
  items: providedItems,
  scope,
  title = "Recent activity",
  viewAllHref,
  emptyMessage = "No activity yet.",
  limit = 6,
}: ActivityFeedProps) {
  const controlled = providedItems !== undefined

  const [items, setItems] = React.useState<ActivityDTO[]>(providedItems ?? [])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(!controlled)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (controlled) setItems(providedItems ?? [])
  }, [controlled, providedItems])

  // Serialised so a new object literal from the parent doesn't re-trigger.
  const scopeKey = JSON.stringify(scope ?? {})

  const load = React.useCallback(
    async (next?: string | null) => {
      if (controlled) return
      if (next) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      try {
        const page = await fetchActivity(
          { ...(JSON.parse(scopeKey) as ActivityScope), limit: variant === "card" ? limit : undefined },
          next
        )
        setItems((prev) => (next ? [...prev, ...page.activities] : page.activities))
        setCursor(page.nextCursor)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activity")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [controlled, scopeKey, variant, limit]
  )

  React.useEffect(() => {
    load()
  }, [load])

  const visible = variant === "card" ? items.slice(0, limit) : items

  /* ── Card ─────────────────────────────────────────────── */
  if (variant === "card") {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          {viewAllHref && items.length > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
              <Link href={viewAllHref}>
                View all
                <ChevronRight className="size-3" />
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-destructive">{error}</p>
        ) : visible.length === 0 ? (
          <Empty message={emptyMessage} />
        ) : (
          <div className="divide-y">
            {visible.map((item) => (
              <Row key={item.id} item={item} dense />
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Timeline ─────────────────────────────────────────── */
  if (variant === "timeline") {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Spinner className="size-5" />
        </div>
      )
    }
    if (error) {
      return <p className="py-8 text-center text-sm text-destructive">{error}</p>
    }
    if (visible.length === 0) return <Empty message={emptyMessage} />

    const grouped = visible.reduce<Record<string, ActivityDTO[]>>((acc, item) => {
      const day = new Date(item.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      ;(acc[day] ??= []).push(item)
      return acc
    }, {})

    return (
      <div className="space-y-8">
        {Object.entries(grouped).map(([day, dayItems]) => (
          <div key={day}>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {day}
            </h4>
            <div className="relative">
              <div className="absolute left-4 top-2 h-[calc(100%-16px)] w-px bg-border" />
              {dayItems.map((item, i) => (
                <TimelineRow
                  key={item.id}
                  item={item}
                  last={i === dayItems.length - 1}
                />
              ))}
            </div>
          </div>
        ))}

        {cursor && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={() => load(cursor)}
            >
              {loadingMore && <Loader2 className="size-4 animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </div>
    )
  }

  /* ── List ─────────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-5" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => load()}>
            Try again
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <Empty message={emptyMessage} />
      ) : (
        <>
          <div className="divide-y">
            {visible.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </div>
          {cursor && (
            <div className="border-t p-3 text-center">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => load(cursor)}
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
