"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FolderKanban, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"
// PROJECT_STATUS_CONFIG is typed as Record<string, …>, so its key type widens
// to `string`. ProjectStatus is the narrow union the API actually validates.
import type { ProjectStatus } from "@/lib/projects"
import { createProject, updateProject } from "@/lib/api/projects"
import type { ProjectCardData } from "@/components/projects/project-card"

const ICONS = ["📁", "🚀", "🎯", "⚙️", "📊", "🧪", "🎨", "🔐", "📦", "🛠️"]

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  icon: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const statusOptions = Object.entries(PROJECT_STATUS_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

export interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  project?: ProjectCardData
  /** Receives the saved project so the caller can update in place. */
  onSuccess?: (project: ProjectCardData) => void
}

export function ProjectDialog({
  open,
  onOpenChange,
  mode,
  project,
  onSuccess,
}: ProjectDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      icon: "📁",
    },
  })

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const isEdit = mode === "edit"

  React.useEffect(() => {
    if (!open) return
    setError(null)
    if (isEdit && project) {
      form.reset({
        name: project.name,
        description: project.description,
        status: project.status,
        icon: project.icon,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        status: "ACTIVE",
        icon: "📁",
      })
    }
  }, [open, isEdit, project, form])

  async function onSubmit(data: FormValues) {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      // Status and icon are sent now — the form collected them before but the
      // request body dropped them on the floor.
      const payload = {
        name: data.name,
        description: data.description ?? "",
        status: data.status as ProjectStatus,
        icon: data.icon || "📁",
      }

      const saved =
        isEdit && project
          ? await updateProject(project.id, payload)
          : await createProject(payload)

      form.reset()
      onOpenChange(false)
      onSuccess?.(saved)
      toast.success(isEdit ? "Project updated" : "Project created")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save project"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full sm:max-w-[480px]",
          "max-h-[90dvh] sm:max-h-[85dvh]",
          "rounded-xl p-0",
          "overflow-hidden",
        )}
      >
        {/* ── Sticky Header ── */}
        <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {isEdit ? (
                <Pencil className="size-4 text-primary" />
              ) : (
                <FolderKanban className="size-4 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">
                {isEdit ? "Edit Project" : "Create Project"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {isEdit
                  ? "Update your project details."
                  : "Create a new project to organize your work."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable Form Body ── */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="My Project"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your project..."
                  className="min-h-[80px] resize-y"
                  {...form.register("description")}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Icon — replaces the old Visibility control, which had no
                  column behind it and could never be saved. */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map((emoji) => {
                    const selected = form.watch("icon") === emoji
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => form.setValue("icon", emoji)}
                        aria-pressed={selected}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg border text-lg transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "hover:bg-accent"
                        )}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* ── Sticky Footer ── */}
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
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting
                ? isEdit ? "Saving..." : "Creating..."
                : isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}