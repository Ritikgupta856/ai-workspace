"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { requestSidebarRefresh } from "@/lib/sidebar-events"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FavoriteEntityType = "PROJECT" | "TASK" | "NOTE" | "WHITEBOARD" | "PAGE"

export function FavoriteButton({
  entityType,
  entityId,
  className,
}: {
  entityType: FavoriteEntityType
  entityId: string
  className?: string
}) {
  const [favorited, setFavorited] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    fetch(`/api/favorites?entityType=${entityType}&entityId=${entityId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setFavorited(json.favorited)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [entityType, entityId])

  async function toggle() {
    const next = !favorited
    setFavorited(next)
    setPending(true)
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to update favorite")
      requestSidebarRefresh()
    } catch (error) {
      setFavorited(!next)
      toast.error(error instanceof Error ? error.message : "Failed to update favorite")
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn("size-9", className)}
      onClick={toggle}
      disabled={!loaded || pending}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={cn("size-4", favorited && "fill-amber-400 text-amber-400")} />
    </Button>
  )
}
