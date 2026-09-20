import Link from "next/link"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">404</p>
        <h1 className="text-2xl font-black text-foreground mb-2">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
