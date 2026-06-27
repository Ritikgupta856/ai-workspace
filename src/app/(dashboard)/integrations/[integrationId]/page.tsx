"use client"

import { useParams } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { PageHeading } from "@/components/ui/page-heading"

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
        <PageHeading title={`Integration ${integrationId}`} />
      </main>
    </>
  )
}
