import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * The bezel every product screenshot sits in: a padded, borderless shell
 * instead of browser chrome. It has no bottom padding, so a screenshot that
 * is cropped short runs off the edge and reads as a product in use.
 */
export function ScreenshotFrame({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  cropClassName,
  className,
}: {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  priority?: boolean
  /** Sizes the visible window, e.g. an aspect ratio shorter than the image. */
  cropClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-white/70 p-1.5 pb-0 shadow-frame backdrop-blur-sm sm:p-2.5 sm:pb-0",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden rounded-t-[14px] bg-white", cropClassName)}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          className="block w-full"
        />
      </div>
    </div>
  )
}
