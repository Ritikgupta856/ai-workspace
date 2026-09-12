import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder shown while `AuthNavStatus` resolves the session server-side. */
export function NavCtaSkeleton({ layout }: { layout: "desktop" | "mobile" }) {
  if (layout === "mobile") {
    return (
      <>
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </>
    )
  }

  return (
    <>
      <Skeleton className="h-9 w-16 rounded-md" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </>
  )
}
