"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="font-semibold"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
