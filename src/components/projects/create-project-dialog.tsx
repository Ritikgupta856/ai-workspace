"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FormDialogFooter,
  FormDialogHeader,
  formChipTrigger,
  formDescriptionFieldClass,
  formDialogBodyClass,
  formDialogContentClass,
  formNameFieldClass,
  submitOnModEnter,
} from "@/components/common/form-dialog"
import { useInvalidateProjects } from "@/lib/query/projects"
import { createProject, updateProject } from "@/lib/api/projects"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/projects"
import type { ProjectCardData } from "@/components/projects/project-card"

const ICONS = [
  "📁", "🚀", "🎯", "⚙️", "📊", "🧪", "🎨", "🔐", "📦", "🛠️",
  "🌐", "📱", "📣", "💡", "🧭", "📝", "🗂️", "🔥", "⭐", "🧩",
]

const STATUS_DOT: Record<ProjectStatus, string> = {
  ACTIVE: "bg-blue-500",
  ON_HOLD: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
  ARCHIVED: "bg-muted-foreground",
}

const formSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(PROJECT_STATUSES),
})

type FormValues = z.infer<typeof formSchema>

export interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  project?: ProjectCardData
  /** Receives the saved project so the caller can update in place. */
  onSuccess?: (project: ProjectCardData) => void
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Project icon"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-lg transition-colors hover:bg-muted/60"
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-pressed={value === emoji}
              onClick={() => {
                onChange(emoji)
                setOpen(false)
              }}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-base transition-colors",
                value === emoji ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-accent"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ProjectDialog({ open, onOpenChange, mode, project, onSuccess }: ProjectDialogProps) {
  const invalidateProjects = useInvalidateProjects()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", icon: "📁", status: "ACTIVE" },
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [createMore, setCreateMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const isEdit = mode === "edit"

  React.useEffect(() => {
    if (!open) return
    setError(null)
    if (isEdit && project) {
      form.reset({
        name: project.name,
        description: project.description,
        icon: project.icon,
        status: project.status,
      })
    } else {
      form.reset({ name: "", description: "", icon: "📁", status: "ACTIVE" })
    }
  }, [open, isEdit, project, form])

  async function onSubmit(data: FormValues) {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: data.name,
        description: data.description ?? "",
        icon: data.icon || "📁",
        status: data.status,
      }

      const saved = isEdit && project ? await updateProject(project.id, payload) : await createProject(payload)

      onSuccess?.(saved)
      invalidateProjects()
      toast.success(isEdit ? "Project updated" : "Project created")

      if (!isEdit && createMore) {
        // Keep the icon and status; clear what is per-project.
        form.reset({ ...form.getValues(), name: "", description: "" })
        form.setFocus("name")
      } else {
        form.reset()
        onOpenChange(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save project"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    form.reset()
    onOpenChange(false)
  }

  // Archiving is a project action, not something you pick while creating one.
  const statusOptions = PROJECT_STATUSES.filter((s) => isEdit || s !== "ARCHIVED")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={formDialogContentClass}
        onPointerDownOutside={(e) => {
          const target = (e.detail?.originalEvent?.target ?? e.target) as HTMLElement | null
          if (target?.closest("[data-radix-popper-content-wrapper]")) {
            e.preventDefault()
          }
        }}
      >
        <FormDialogHeader
          title={isEdit ? "Edit project" : "New project"}
          description={isEdit ? "Update your project details." : "Create a new project to organize your work."}
        />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={submitOnModEnter(() => void form.handleSubmit(onSubmit)())}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={formDialogBodyClass}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <IconPicker value={form.watch("icon") || "📁"} onChange={(icon) => form.setValue("icon", icon)} />
                <Input
                  autoFocus
                  placeholder="Project name"
                  aria-label="Project name"
                  className={formNameFieldClass}
                  {...form.register("name")}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <Textarea
              placeholder="Add a description… (optional)"
              aria-label="Description"
              className={formDescriptionFieldClass}
              {...form.register("description")}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as ProjectStatus)}
              >
                <SelectTrigger className={formChipTrigger} aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[s])} />
                        {PROJECT_STATUS_CONFIG[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="rounded-md bg-destructive/10 px-2.5 py-2 text-xs text-destructive">{error}</p>}
          </div>

          <FormDialogFooter
            createMore={isEdit ? undefined : createMore}
            onCreateMoreChange={isEdit ? undefined : setCreateMore}
            onCancel={handleCancel}
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create project"}
            submittingLabel={isEdit ? "Saving..." : "Creating..."}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
