"use client"

import { useParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function IntegrationDetailPage() {
  const { integrationId } = useParams<{ integrationId: string }>()

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
        <span className="text-sm font-medium text-muted-foreground">Integration</span>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <h2 className="text-lg font-semibold">Integration {integrationId}</h2>
      </main>
    </>
  )
}
