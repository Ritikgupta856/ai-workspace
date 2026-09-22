import { cn } from "@/lib/utils"

/**
 * A single placeholder block.
 *
 * The sweep lives on an overlay rather than on the element itself, so a
 * skeleton can be given any size, radius or background at the call site
 * without the animation having to be restated — every placeholder in the app
 * ends up moving at the same speed and in the same direction.
 *
 * Respects `prefers-reduced-motion`: the sweep stops, the block stays.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-muted relative isolate overflow-hidden rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-linear-to-r before:from-transparent before:via-black/6 before:to-transparent",
        "before:animate-shimmer dark:before:via-white/8",
        "motion-reduce:before:animate-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * Wraps a whole loading view. Marks it as busy for assistive tech, which
 * individual skeleton blocks deliberately do not do — one announcement per
 * region, not one per grey rectangle.
 */
function SkeletonRegion({
  label = "Loading",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-content-in", className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export { Skeleton, SkeletonRegion }
