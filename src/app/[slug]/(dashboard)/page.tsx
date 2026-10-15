import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { HomeView } from "@/components/home/home-view"
import { getHomeData } from "@/lib/home"
import { prisma } from "@/lib/prisma"
import { getCachedSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Home",
  description: "Your tasks, deadlines and project progress across the workspace.",
}

export default async function HomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getCachedSession()
  // The layout has already redirected signed-out users and non-members.
  if (!session?.user) notFound()

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!workspace) notFound()

  const data = await getHomeData(session.user.id, workspace.id)
  const firstName = session.user.name?.split(" ")[0] || "there"

  return <HomeView data={data} firstName={firstName} />
}
