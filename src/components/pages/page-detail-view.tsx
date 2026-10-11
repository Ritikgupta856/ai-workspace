"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Check, FileText, MoreHorizontal, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Editor } from "@tiptap/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Kbd } from "@/components/ui/kbd"
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
import { PageDetailSkeleton } from "@/components/dashboard/loading-states"
import { PageEditor } from "@/components/pages/page-editor"
import { PageEditorToolbar } from "@/components/pages/page-editor-toolbar"
import { updatePage, deletePage, type PageDetail } from "@/lib/api/page"
import { useFavorite } from "@/lib/query/favorites"
import { useCachePage, usePage } from "@/lib/query/pages"
import { cn } from "@/lib/utils"

const AUTOSAVE_DELAY = 1000
const ICONS = ["📄", "📝", "📋", "📊", "🚀", "🎯", "⚙️", "🔐", "🧪", "📚"]

/**
 * The page editor, opened at `/<slug>/projects/<projectId>/pages/<pageId>`.
 * Loads the document through the cache (so reopening is instant), then hands
 * it to the editor, which keeps its own draft.
 */
export function PageDetailView({ pageId }: { pageId: string }) {
  const { data: page, isPending, error } = usePage(pageId)

  if (isPending) return <PageDetailSkeleton />

  if (error || !page) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-destructive">
        {error?.message ?? "Page not found"}
      </div>
    )
  }

  return <PageDocument key={page.id} initial={page} />
}

function PageDocument({ initial }: { initial: PageDetail }) {
  const pageId = initial.id
  const cachePage = useCachePage()
  const router = useRouter()
  const slug = useParams().slug as string

  const [page, setPage] = React.useState<PageDetail>(initial)
  const [title, setTitle] = React.useState(initial.title)
  const [icon, setIcon] = React.useState<string | null>(initial.icon)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const { favorited, toggle: toggleFavorite } = useFavorite("PAGE", pageId)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [editor, setEditor] = React.useState<Editor | null>(null)

  // Only the editor's JSON needs a ref — it changes on every keystroke and
  // nothing renders from it. Title and icon are passed into `save` instead of
  // being mirrored into refs during render.
  const contentRef = React.useRef<unknown>(initial.content)

  const save = React.useCallback(async (nextTitle: string, nextIcon: string | null) => {
    setSaving(true)
    try {
      const updated = await updatePage(pageId, {
        title: nextTitle.trim() || "Untitled",
        icon: nextIcon,
        content: contentRef.current,
      })
      setPage(updated)
      cachePage(updated)
      setDirty(false)
      setLastSavedAt(new Date())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save page")
    } finally {
      setSaving(false)
    }
  }, [pageId, cachePage])

  React.useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(() => save(title, icon), AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [dirty, save, title, icon])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (dirty) save(title, icon)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dirty, save, title, icon])

  React.useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  async function handleDelete() {
    try {
      await deletePage(page.id)
      toast.success("Page deleted")
      router.push(`/${slug}/projects/${page.projectId}/pages`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page")
      setConfirmDelete(false)
    }
  }

  const projectRoot = `/${slug}/projects/${page.project.id}/overview`
  const pagesRoot = `/${slug}/projects/${page.project.id}/pages`

  return (
    <div className="flex flex-1 flex-col">
      {/* Breadcrumb: project first, matching every other project surface. */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-sm text-muted-foreground">
          <Link
            href={projectRoot}
            className="flex min-w-0 shrink-0 items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent hover:text-foreground"
          >
            <span className="max-w-40 truncate">{page.project.name}</span>
          </Link>
          <span className="shrink-0">/</span>
          <Link
            href={pagesRoot}
            className="flex shrink-0 items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent hover:text-foreground"
          >
            <FileText className="size-3.5 shrink-0" />
            Pages
          </Link>
          <span className="shrink-0">/</span>
          <span className="min-w-0 truncate rounded px-1.5 py-1 font-medium text-foreground">
            {title.trim() || "Untitled"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "hidden items-center gap-1.5 px-2 text-xs sm:flex",
              saving ? "text-muted-foreground" : dirty ? "text-amber-600" : "text-muted-foreground/70"
            )}
          >
            {saving ? (
              <>
                <Spinner className="size-3" />
                Saving…
              </>
            ) : dirty ? (
              <>
                Unsaved
                <Kbd className="hidden lg:inline-flex">⌘S</Kbd>
              </>
            ) : (
              <>
                <Check className="size-3" />
                {lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Saved"}
              </>
            )}
          </span>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFavorite}
            aria-label={favorited ? "Unfavorite" : "Favorite"}
          >
            <Star className={cn("size-4", favorited && "fill-amber-400 text-amber-400")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More">
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
        </div>
      </div>

      <PageEditorToolbar editor={editor} />

      {/* Document body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-14 sm:px-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mb-2 flex size-12 items-center justify-center rounded-xl text-4xl hover:bg-accent"
                aria-label="Change icon"
              >
                {icon || "📄"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <div className="grid grid-cols-5 gap-1 p-1">
                {ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setIcon(emoji)
                      setDirty(true)
                    }}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md text-lg hover:bg-accent",
                      icon === emoji && "bg-accent"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setDirty(true)
            }}
            placeholder="Untitled"
            className="w-full border-0 bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 sm:text-5xl"
          />

          <div className="mt-6">
            <PageEditor
              content={page.content}
              onEditorReady={setEditor}
              onChange={(json) => {
                contentRef.current = json
                setDirty(true)
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page?</DialogTitle>
            <DialogDescription>
              &ldquo;{page.title}&rdquo; will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
