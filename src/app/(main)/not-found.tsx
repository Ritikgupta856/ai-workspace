import Link from "next/link"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-2">404</p>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white font-semibold">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
