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
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_VISIBILITY_CONFIG,
} from "@/lib/constants"
import type { ProjectCardData } from "@/components/projects/project-card"

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  visibility: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const statusOptions = Object.entries(PROJECT_STATUS_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

const visibilityOptions = Object.entries(PROJECT_VISIBILITY_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

export interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  project?: ProjectCardData
  onSuccess?: () => void
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
      visibility: "PRIVATE",
    },
  })

  const [submitting, setSubmitting] = React.useState(false)
  const isEdit = mode === "edit"

  React.useEffect(() => {
    if (!open) return
    if (isEdit && project) {
      form.reset({
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: "PRIVATE",
      })
    } else {
      form.reset({
        name: "",
        description: "",
        status: "ACTIVE",
        visibility: "PRIVATE",
      })
    }
  }, [open, isEdit, project, form])

  async function onSubmit(data: FormValues) {
    if (submitting) return
    setSubmitting(true)
    // TODO: call API
    await new Promise((r) => setTimeout(r, 500))
    form.reset()
    onOpenChange(false)
    setSubmitting(false)
    onSuccess?.()
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

              {/* Status + Visibility */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Visibility</label>
                  <Select
                    value={form.watch("visibility")}
                    onValueChange={(v) => form.setValue("visibility", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select visibility..." />
                    </SelectTrigger>
                    <SelectContent>
                      {visibilityOptions.map((opt) => {
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
              </div>

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