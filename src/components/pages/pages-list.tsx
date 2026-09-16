"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatUpdatedDate } from "@/lib/date"
import { createPage, deletePage, type PageSummary } from "@/lib/api/page"

interface PagesListProps {
  pages: PageSummary[]
  /** Fixed for the whole list — a single project's pages, or workspace-level when omitted. */
  projectId?: string | null
  onChanged: () => void
}

export function NewPageButton({
  projectId = null,
  onCreated,
  label = "New page",
}: {
  projectId?: string | null
  onCreated: () => void
  label?: string
}) {
  const router = useRouter()
  const [creating, setCreating] = React.useState(false)

  async function handleCreate() {
    setCreating(true)
    try {
      const page = await createPage({ title: "Untitled", projectId })
      onCreated()
      router.push(`/pages/${page.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create page")
      setCreating(false)
    }
  }

  return (
    <Button size="sm" onClick={handleCreate} disabled={creating}>
      <Plus className="size-4" />
      {label}
    </Button>
  )
}

export function PagesList({ pages, projectId = null, onChanged }: PagesListProps) {
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <FileText className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">No pages yet</p>
        <p className="text-sm text-muted-foreground">Create a page to start writing.</p>
        <div className="mt-2">
          <NewPageButton projectId={projectId} onCreated={onChanged} />
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="divide-y">
        {pages.map((page) => (
          <PageRow key={page.id} page={page} onChanged={onChanged} />
        ))}
      </div>
    </div>
  )
}

function PageRow({ page, onChanged }: { page: PageSummary; onChanged: () => void }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePage(page.id)
      toast.success("Page deleted")
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page")
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      <Link href={`/pages/${page.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base">
          {page.icon || "📄"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{page.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {page.createdBy.name} · updated {formatUpdatedDate(page.updatedAt)}
          </p>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Actions for ${page.title}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{page.title}&rdquo;?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
