import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PenTool } from "lucide-react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NewBoardButton } from "@/components/boards/new-board-button"
import { PageHeader } from "@/components/dashboard/page-header"
import { formatUpdatedDate } from "@/lib/date"

export const metadata: Metadata = {
  title: "Boards",
  description: "Visual whiteboards for brainstorming and planning.",
}

export default async function BoardsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })
  if (!membership) redirect("/projects")

  const boards = await prisma.whiteboard.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      project: { select: { name: true, icon: true } },
    },
  })

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Boards" action={<NewBoardButton />} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {boards.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-16 text-center shadow-sm">
          <div className="bg-muted flex size-11 items-center justify-center rounded-xl">
            <PenTool className="text-muted-foreground size-5" />
          </div>
          <p className="mt-4 text-sm font-medium">No boards yet</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Create a board to diagram an architecture, map a flow, or think
            something through visually.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="group hover:border-foreground/15 flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-colors"
            >
              <div className="bg-muted/40 flex h-28 items-center justify-center rounded-lg border border-dashed">
                <PenTool className="text-muted-foreground/40 size-6" />
              </div>

              <p className="mt-4 truncate text-sm font-medium">{board.title}</p>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {board.project ? `${board.project.icon ?? "📁"} ${board.project.name} · ` : ""}
                Edited {formatUpdatedDate(board.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
