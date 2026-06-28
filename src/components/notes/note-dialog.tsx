"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Note } from "@/components/notes/note-card"

const availableTags = [
  "auth", "architecture", "sprint", "planning", "backend", "performance",
  "frontend", "database", "review", "devops", "runbook", "design",
  "docs", "API", "testing", "security",
]

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  note?: Note
  onSuccess?: (note: { title: string; tags: string[] }) => void
}

function TagMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (tags: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)

  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-h-10 h-auto w-full justify-between font-normal"
        >
          {selected.length > 0 ? (
            <div className="mr-2 flex flex-wrap gap-1 py-0.5">
              {selected.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(tag)
                    }}
                    className="hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">Select tags...</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        avoidCollisions
        collisionPadding={8}
      >
        <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1">
          {availableTags.map((tag) => {
            const isSelected = selected.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}
                >
                  {isSelected && <Check className="size-3" />}
                </div>
                {tag}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function NoteDialog({
  open,
  onOpenChange,
  mode,
  note,
  onSuccess,
}: NoteDialogProps) {
  const [title, setTitle] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const isEdit = mode === "edit"

  React.useEffect(() => {
    if (!open) return
    if (isEdit && note) {
      setTitle(note.title)
      setTags(note.tags)
    } else {
      setTitle("")
      setTags([])
    }
  }, [open, note, isEdit])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSuccess?.({ title: title.trim(), tags })
    onOpenChange(false)
  }

  function handleCancel() {
    setTitle("")
    setTags([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[500px] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {isEdit ? "Edit Note" : "New Note"}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-sm">
            {isEdit
              ? "Update the note name and tags."
              : "Give your note a name and add tags."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 py-5 sm:px-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags</label>
                <TagMultiSelect selected={tags} onChange={setTags} />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-5 py-4 sm:px-6 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="w-full sm:w-auto"
            >
              {isEdit ? "Save Changes" : "Create Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
