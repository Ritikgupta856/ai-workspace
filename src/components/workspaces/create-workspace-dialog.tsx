"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Users,
  LayoutDashboard,
  Shield,
  X,
  Building2,
  ImageIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { createWorkspaceSchema, type CreateWorkspaceValues } from "@/lib/validation/workspace"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
const MAX_SIZE = 2 * 1024 * 1024

const features = [
  {
    icon: Users,
    title: "Invite your team",
    description: "Add members and collaborate together.",
  },
  {
    icon: LayoutDashboard,
    title: "Organize everything",
    description: "Projects, Tasks, Notes, Documents and AI.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    description: "Workspace-level permissions and isolated data.",
  },
]

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [logoError, setLogoError] = React.useState<string | null>(null)

  const form = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, reset } = form
  const [submitting, setSubmitting] = React.useState(false)
  const [descCount, setDescCount] = React.useState(0)

  React.useEffect(() => {
    if (!open) {
      reset()
      setLogoPreview(null)
      setLogoError(null)
      setDescCount(0)
    }
  }, [open, reset])

  const validateAndSetLogo = React.useCallback((file: File) => {
    setLogoError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Only PNG, JPG, and SVG files are allowed.")
      return
    }

    if (file.size > MAX_SIZE) {
      setLogoError("File size must be under 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setLogoPreview(dataUrl)
      setValue("logo", dataUrl)
    }
    reader.readAsDataURL(file)
  }, [setValue])

  const handleFileDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetLogo(file)
  }, [validateAndSetLogo])

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetLogo(file)
  }, [validateAndSetLogo])

  const removeLogo = React.useCallback(() => {
    setLogoPreview(null)
    setLogoError(null)
    setValue("logo", "")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [setValue])

  async function onSubmit(data: CreateWorkspaceValues) {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create workspace")
      }

      toast.success("Workspace created successfully.")
      onOpenChange(false)
      onSuccess?.()
      router.push("/home")
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full sm:max-w-[900px]",
          "max-h-[85dvh]",
          "rounded-xl p-0",
          "overflow-hidden",
          "flex flex-row",
          "gap-0",
        )}
      >
        {/* ── Left Panel ── */}
        <div className="relative hidden w-[35%] shrink-0 sm:flex flex-col justify-between bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-950/40 dark:to-blue-900/20 p-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-blue-200/40 dark:bg-blue-800/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 size-64 rounded-full bg-blue-200/30 dark:bg-blue-800/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6">
            {/* Icon */}
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Building2 className="size-7 text-white" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Create a new workspace
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Workspaces help you organize projects, tasks, notes, documents, AI conversations, and collaboration in one place.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="relative z-10 space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-blue-200/60 dark:border-blue-800/30 bg-white/70 dark:bg-white/5 backdrop-blur-sm p-3.5 transition-colors hover:bg-white/90 dark:hover:bg-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Icon className="size-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex flex-1 flex-col min-w-0 px-8 py-7 sm:py-9 overflow-y-auto">
          {/* Header */}
          <div className="mb-7 space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Create Workspace
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Set up your workspace and start collaborating.
            </DialogDescription>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 space-y-5">
              {/* Workspace Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Workspace Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Acme Inc."
                  disabled={submitting}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Description <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <span className={cn(
                    "text-xs tabular-nums",
                    descCount > 180 ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    {descCount}/200
                  </span>
                </div>
                <Textarea
                  placeholder="Tell your team what this workspace is about..."
                  disabled={submitting}
                  className={cn(
                    "min-h-[80px] resize-y",
                    errors.description ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                  {...register("description", {
                    onChange: (e) => setDescCount(e.target.value.length),
                  })}
                />
                {errors.description && (
                  <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Workspace Logo <span className="text-xs text-muted-foreground">(Optional)</span>
                </label>

                {logoPreview ? (
                  <div className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-medium text-foreground">Logo uploaded</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        disabled={submitting}
                      >
                        <X className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Drop an image here, or{" "}
                        <span className="text-primary underline-offset-4 hover:underline">browse</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        PNG, JPG or SVG. Max 2MB.
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={submitting}
                    />
                  </div>
                )}
                {logoError && (
                  <p className="text-xs font-medium text-destructive">{logoError}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-7 flex items-center justify-end gap-3 pt-5 border-t">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="text-white" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
