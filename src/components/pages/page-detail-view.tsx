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
import { fetchPage, updatePage, deletePage, type PageDetail } from "@/lib/api/page"
import { cn } from "@/lib/utils"

const AUTOSAVE_DELAY = 1000
const ICONS = ["📄", "📝", "📋", "📊", "🚀", "🎯", "⚙️", "🔐", "🧪", "📚"]

/**
 * The page editor, rendered by both page routes.
 *
 * A page that belongs to a project is opened at
 * `/<slug>/projects/<projectId>/pages/<pageId>`; one that doesn't keeps the
 * workspace-level `/<slug>/pages/<pageId>`. Both render this, so the editor
 * exists once regardless of how it was reached.
 */
export function PageDetailView({ pageId }: { pageId: string }) {
  const router = useRouter()
  const slug = useParams().slug as string

  const [page, setPage] = React.useState<PageDetail | null>(null)
  const [title, setTitle] = React.useState("")
  const [icon, setIcon] = React.useState<string | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [favorited, setFavorited] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [editor, setEditor] = React.useState<Editor | null>(null)

  // Only the editor's JSON needs a ref — it changes on every keystroke and
  // nothing renders from it. Title and icon are passed into `save` instead of
  // being mirrored into refs during render.
  const contentRef = React.useRef<unknown>(null)

  // `loading` already starts true, so nothing needs resetting before the
  // fetch — state is only written once the request settles. `cancelled` stops
  // a slow response for a page you have already navigated away from landing on
  // top of the one you are now looking at.
  React.useEffect(() => {
    let cancelled = false

    fetchPage(pageId)
      .then((page) => {
        if (cancelled) return
        setPage(page)
        setTitle(page.title)
        setIcon(page.icon)
        contentRef.current = page.content
        setDirty(false)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load page")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pageId])

  React.useEffect(() => {
    fetch(`/api/favorites?entityType=PAGE&entityId=${pageId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setFavorited(json.favorited)
      })
      .catch(() => {})
  }, [pageId])

  const save = React.useCallback(async (nextTitle: string, nextIcon: string | null) => {
    setSaving(true)
    try {
      const updated = await updatePage(pageId, {
        title: nextTitle.trim() || "Untitled",
        icon: nextIcon,
        content: contentRef.current,
      })
      setPage(updated)
      setDirty(false)
      setLastSavedAt(new Date())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save page")
    } finally {
      setSaving(false)
    }
  }, [pageId])

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

  async function toggleFavorite() {
    const next = !favorited
    setFavorited(next)
    try {
      await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "PAGE", entityId: pageId }),
      })
    } catch {
      setFavorited(!next)
      toast.error("Failed to update favorite")
    }
  }

  async function handleDelete() {
    if (!page) return
    try {
      await deletePage(page.id)
      toast.success("Page deleted")
      router.push(page.projectId ? `/${slug}/projects/${page.projectId}/pages` : `/${slug}/pages`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page")
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return <PageDetailSkeleton />
  }

  if (error || !page) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-destructive">
        {error ?? "Page not found"}
      </div>
    )
  }

  const projectRoot = page.project ? `/${slug}/projects/${page.project.id}/overview` : null
  const pagesRoot = page.project ? `/${slug}/projects/${page.project.id}/pages` : `/${slug}/pages`

  return (
    <div className="flex flex-1 flex-col">
      {/* Breadcrumb: project first, matching every other project surface. */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-sm text-muted-foreground">
          {projectRoot && page.project ? (
            <>
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
            </>
          ) : (
            <Link
              href={pagesRoot}
              className="flex min-w-0 shrink-0 items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent hover:text-foreground"
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="max-w-40 truncate">Pages</span>
            </Link>
          )}
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
