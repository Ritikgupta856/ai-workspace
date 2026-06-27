"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { formatDueDate } from "@/lib/date"
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  FolderKanban,
  Clock,
  X,
} from "lucide-react"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/lib/constants"
import type { TaskStatus, TaskPriority, Task } from "@/app/(dashboard)/tasks/page"
import { createTask, updateTask } from "@/lib/api/tasks"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  addToBacklog: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

const projects = [
  { id: "synapse", name: "Synapse" },
  { id: "portfolio", name: "Portfolio" },
  { id: "workspace", name: "Workspace" },
  { id: "basicx-sports", name: "BasicX Sports" },
]

const assignees = [
  { id: "ritik", name: "Ritik Gupta", initials: "RG" },
  { id: "priya", name: "Priya Sharma", initials: "PS" },
  { id: "arjun", name: "Arjun Patel", initials: "AP" },
  { id: "meera", name: "Meera Singh", initials: "MS" },
]

const availableLabels = [
  "Backend", "Auth", "AI", "Frontend", "Bug", "Design",
  "DevOps", "Docs", "GitHub", "RAG", "Refactor", "Search", "UI",
]

const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

function LabelMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (labels: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)

  function toggle(label: string) {
    onChange(
      selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label]
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
            <div className="flex flex-wrap gap-1 py-0.5 mr-2">
              {selected.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(label) }}
                    className="hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">Select labels...</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Portal to body — escapes overflow:hidden on dialog */}
      <PopoverContent
        className="w-56 p-2"
        align="start"
        avoidCollisions
        collisionPadding={8}
      >
        <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
          {availableLabels.map((label) => {
            const isSelected = selected.includes(label)
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <div className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {isSelected && <Check className="size-3" />}
                </div>
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DatePicker({
  value,
  onChange,
}: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value ? formatDueDate(value) : "Pick a date..."}
        </Button>
      </PopoverTrigger>
      {/* Portal to body — escapes overflow:hidden on dialog */}
      <PopoverContent
        className="w-auto p-0"
        align="start"
        avoidCollisions
        collisionPadding={8}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => { onChange(date); setOpen(false) }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  task?: Task
  onSuccess?: () => void
}

export function TaskDialog({
  open,
  onOpenChange,
  mode,
  task,
  onSuccess,
}: TaskDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      assigneeId: "",
      status: "TODO",
      priority: "MEDIUM",
      labels: [],
      dueDate: undefined,
      estimatedHours: undefined,
      addToBacklog: false,
    },
  })

  const watchedLabels = form.watch("labels") ?? []
  const [submitting, setSubmitting] = React.useState(false)
  const isEdit = mode === "edit"

  React.useEffect(() => {
    if (!open) return
    if (isEdit && task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        projectId: projects.find((p) => p.name === task.project)?.id ?? "",
        assigneeId: assignees.find((a) => a.name === task.assignee)?.id ?? "",
        status: task.status,
        priority: task.priority,
        labels: task.labels,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedHours: undefined,
        addToBacklog: false,
      })
    } else {
      form.reset({
        title: "",
        description: "",
        projectId: "",
        assigneeId: "",
        status: "TODO",
        priority: "MEDIUM",
        labels: [],
        dueDate: undefined,
        estimatedHours: undefined,
        addToBacklog: false,
      })
    }
  }, [open, task, isEdit, form])

  async function onSubmit(data: FormValues) {
    if (submitting) return
    setSubmitting(true)
    try {
      if (isEdit && task) {
        await updateTask(task.id, {
          title: data.title,
          description: data.description ?? "",
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          labels: data.labels ?? [],
          dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
        })
      } else {
        await createTask({
          title: data.title,
          description: data.description ?? "",
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          labels: data.labels ?? [],
          dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
        })
      }
      form.reset()
      onSuccess?.()
      onOpenChange(false)
    } catch {
      // error handled in parent
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
          // Size: full-width on mobile, capped on desktop
          "w-full sm:max-w-[760px]",
          // Height: leaves room for browser chrome on mobile with dvh
          "max-h-[90dvh] sm:max-h-[85dvh]",
          // Padding & rounding from shadcn base are stripped in dialog.tsx;
          // we own all spacing here
          "rounded-xl p-0",
          // overflow-hidden clips the rounded corners cleanly;
          // actual scrolling happens on the inner div below
          "overflow-hidden",
        )}
        onPointerDownOutside={(e) => {
          const target = (e.detail?.originalEvent?.target ?? e.target) as HTMLElement | null
          if (target?.closest("[data-radix-popper-content-wrapper]")) {
            e.preventDefault()
          }
        }}
      >
        {/* ── Sticky Header ── */}
        <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {isEdit ? "Edit Task" : "New Task"}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-sm">
            {isEdit
              ? "Update the task details."
              : "Create a new task and add all the essential details."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Scrollable Form Body ── */}
        {/*
          The form is flex-col + flex-1 so it fills the space between
          header and footer. min-h-0 prevents the classic flexbox bug
          where children refuse to shrink below their content height.
        */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <Input placeholder="Implement GitHub OAuth" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the task..."
                  className="min-h-[90px] resize-y"
                  {...form.register("description")}
                />
              </div>

              {/* 2-col grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Project */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={form.watch("projectId")} onValueChange={(v) => form.setValue("projectId", v)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder="Select project..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Assignee</label>
                  <Select value={form.watch("assigneeId")} onValueChange={(v) => form.setValue("assigneeId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 shrink-0">
                              <AvatarFallback className="text-[10px]">{a.initials}</AvatarFallback>
                            </Avatar>
                            {a.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", opt.className)}>
                              <Icon className="size-3" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", opt.className)}>
                              <Icon className="size-3" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Labels</label>
                  <LabelMultiSelect
                    selected={watchedLabels}
                    onChange={(labels) => form.setValue("labels", labels)}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Due Date</label>
                  <DatePicker
                    value={form.watch("dueDate")}
                    onChange={(date) => form.setValue("dueDate", date)}
                  />
                </div>

                {/* Estimated Hours */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Estimated Hours</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="e.g. 4"
                      className="pl-9"
                      onChange={(e) => {
                        const v = e.target.value
                        form.setValue("estimatedHours", v ? parseFloat(v) : undefined)
                      }}
                    />
                  </div>
                </div>

                {/* Add to Backlog */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Add to Backlog</label>
                  <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                    <Switch
                      checked={form.watch("addToBacklog") ?? false}
                      onCheckedChange={(v) => form.setValue("addToBacklog", v)}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium">
                        {form.watch("addToBacklog") ? "Added to backlog" : "Not in backlog"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {form.watch("addToBacklog")
                          ? "Task will appear in the backlog view"
                          : "Task will be placed in the active sprint"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Sticky Footer ── */}
          <DialogFooter className="shrink-0 border-t px-5 py-4 sm:px-6 sm:justify-between">
            <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting
                ? (isEdit ? "Saving..." : "Creating...")
                : (isEdit ? "Save Changes" : "Create Task")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}