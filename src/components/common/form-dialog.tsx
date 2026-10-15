"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/*
 * Shared pieces of the "create" dialogs (task, project). Sizes match the design
 * reference at 1x: 560px dialog, 16px gutters, 15px title and name field, 13px
 * description, 12px chips/labels/buttons, 26px chips, 30px footer buttons.
 */

export const formDialogContentClass =
  "max-h-[90dvh] w-[calc(100vw-32px)] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-[560px] sm:rounded-xl"

export const formDialogBodyClass = "flex-1 space-y-3 overflow-y-auto px-4 pb-4"

// The base inputs draw an offset ring outside the field, which the scrolling
// body clips at its edges. Drawing it inset keeps the focus border inside.
export const formFieldFocus =
  "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0"

/** The big name field at the top of the dialog. */
export const formNameFieldClass = cn(
  "h-9 rounded-md px-2.5 text-[15px] shadow-none md:text-[15px]",
  formFieldFocus
)

export const formDescriptionFieldClass = cn(
  "min-h-[78px] resize-y rounded-md px-2.5 py-2 text-[13px] leading-5 shadow-none md:text-[13px]",
  formFieldFocus
)

/** A 26px property chip (project, status, priority…). */
export const formChip =
  "inline-flex h-6.5 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-normal text-foreground shadow-none"

/** `formChip` on a Select trigger: no chevron, placeholder in normal text colour. */
export const formChipTrigger = cn(
  formChip,
  "w-auto justify-start py-0 data-[placeholder]:text-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:hidden"
)

export const formChipIcon = "size-3.5 shrink-0 text-foreground/70"

/** Title row with the close button aligned to it. The description is for screen readers. */
export function FormDialogHeader({ title, description }: { title: string; description: string }) {
  return (
    <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 space-y-0 p-4 text-left">
      <DialogTitle className="text-[15px] leading-[22px] font-semibold">{title}</DialogTitle>
      <DialogDescription className="sr-only">{description}</DialogDescription>
      <DialogClose
        className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Close"
      >
        <X className="size-4" />
      </DialogClose>
    </DialogHeader>
  )
}

/**
 * "Create more" on the left (create mode only), the Ctrl+Enter hint, Cancel and
 * the submit button. The form owns the Ctrl+Enter handler.
 */
export function FormDialogFooter({
  createMore,
  onCreateMoreChange,
  onCancel,
  submitting,
  submitLabel,
  submittingLabel,
}: {
  /** Omit to hide the switch (edit mode). */
  createMore?: boolean
  onCreateMoreChange?: (value: boolean) => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
  submittingLabel: string
}) {
  const kbd =
    "flex h-[18px] items-center justify-center rounded border border-border bg-card font-mono text-[10.5px] text-muted-foreground"

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3">
      {createMore !== undefined && onCreateMoreChange ? (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={createMore}
            onCheckedChange={onCreateMoreChange}
            aria-label="Create more"
            className="h-[18px] w-[30px] [&>span]:size-[14px] data-[state=checked]:[&>span]:translate-x-3"
          />
          Create more
        </label>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 sm:flex">
          <kbd className={cn(kbd, "px-1")}>Ctrl</kbd>
          <kbd className={cn(kbd, "min-w-[18px]")}>↵</kbd>
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-7.5 rounded-md border-border px-3 text-xs font-medium shadow-none"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="h-7.5 rounded-md px-3 text-xs font-semibold">
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </div>
  )
}

/** Submits the surrounding form on Ctrl/Cmd+Enter. Spread onto the <form>'s onKeyDown. */
export function submitOnModEnter(submit: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit()
    }
  }
}
