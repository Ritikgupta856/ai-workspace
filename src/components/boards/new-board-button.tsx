"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function NewBoardButton() {
  const router = useRouter()
  const [creating, setCreating] = React.useState(false)

  const create = React.useCallback(async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Could not create board")
      const { board } = (await res.json()) as { board: { id: string } }
      router.push(`/boards/${board.id}`)
    } catch {
      setCreating(false)
    }
  }, [router])

  return (
    <Button size="sm" onClick={create} disabled={creating}>
      {creating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      New board
    </Button>
  )
}
