"use client"

import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useFavorite, type FavoriteEntityType } from "@/lib/query/favorites"
import { cn } from "@/lib/utils"

export function FavoriteButton({
  entityType,
  entityId,
  className,
  initial,
}: {
  entityType: FavoriteEntityType
  entityId: string
  className?: string
  /** The answer, if the page already has it, so the star needs no request of its own. */
  initial?: boolean
}) {
  const { favorited, loaded, pending, toggle } = useFavorite(entityType, entityId, initial)

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
