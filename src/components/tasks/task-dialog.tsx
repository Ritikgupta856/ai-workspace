"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { formatDueDate } from "@/lib/date"
import {
  AlertCircle,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  CircleDashed,
  Plus,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Tag,
  UserRound,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  FormDialogFooter,
  FormDialogHeader,
  formChip,
  formChipIcon,
  formChipTrigger,
  formDescriptionFieldClass,
  formDialogBodyClass,
  formDialogContentClass,
  formFieldFocus,
  formNameFieldClass,
  submitOnModEnter,
} from "@/components/common/form-dialog"
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
import { PersonAvatar } from "@/components/tasks/task-grouped-list"
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/lib/constants"
import type { TaskStatus, TaskPriority, Task } from "@/components/tasks/tasks-view"
import { createTask, updateTask } from "@/lib/api/tasks"
import { useAssignableMembers } from "@/lib/query/tasks"
import { useProjectList } from "@/lib/query/projects"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

export const availableLabels = [
  "Backend", "Auth", "AI", "Frontend", "Bug", "Design",
  "DevOps", "Docs", "GitHub", "RAG", "Refactor", "Search", "UI",
]

const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

const priorityOptions = Object.entries(TASK_PRIORITY_CONFIG).map(
  ([value, config]) => ({ value, ...config })
)

const LABEL_DOTS = ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-cyan-500"]

/** A stable colour per label name, so "Design" is the same dot everywhere. */
export function labelDot(label: string) {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  return LABEL_DOTS[hash % LABEL_DOTS.length]
}

export function LabelMultiSelect({
  selected,
  onChange,
  variant = "field",
}: {
  selected: string[]
  onChange: (labels: string[]) => void
  /** `field`: a bordered form input. `inline`: label pills that edit in place, for record views. `chip`: a dialog property chip. */
  variant?: "field" | "inline" | "chip"
}) {
  const inline = variant === "inline"
  const chip = variant === "chip"
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
          className={
            chip
              ? "h-6.5 gap-1.5 rounded-md border-border bg-card px-2 py-0 text-xs font-normal text-foreground shadow-none [&_svg]:size-3.5"
              : inline
              ? "-ml-1.5 h-auto min-h-7 w-auto max-w-full justify-start gap-1 border-none bg-transparent px-1.5 py-0.5 text-[13px] font-normal shadow-none hover:bg-muted data-[state=open]:bg-muted"
              : "min-h-10 h-auto w-full justify-between font-normal"
          }
        >
          {chip ? (
            <>
              <Tag className="size-3.5 shrink-0 text-foreground/70" />
              <span>
                {selected.length === 0 ? "Labels" : selected.length === 1 ? selected[0] : `${selected.length} labels`}
              </span>
            </>
          ) : inline ? (
            selected.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {selected.map((label) => (
                  <span
                    key={label}
                    className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs text-foreground"
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", labelDot(label))} />
                    {label}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">Add labels</span>
            )
          ) : selected.length > 0 ? (
            <div className="mr-2 flex flex-wrap gap-1 py-0.5">
              {selected.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {label}
                  {/* A span, not a button: it sits inside the trigger button, and
                      buttons can't nest. Pointer-down is stopped so removing a
                      label doesn't also open the picker. */}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${label}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); toggle(label) }}
                    className="cursor-pointer hover:text-foreground"
                  >
                    <X className="size-3" />
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">Select labels...</span>
          )}
          {!chip && !inline && <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />}
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

const NO_VALUE = "none"

const chipBase = formChip
const chipTrigger = formChipTrigger
const chipIcon = formChipIcon

// Same hash the sidebar uses, so a project keeps its colour everywhere.
const PROJECT_DOTS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-cyan-500",
]

function projectDot(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PROJECT_DOTS[hash % PROJECT_DOTS.length]
}

const STATUS_ICON_CLASS: Record<string, string> = {
  TODO: "text-foreground/70",
  IN_PROGRESS: "text-amber-500",
  IN_REVIEW: "text-violet-500",
  DONE: "text-emerald-500",
}

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "URGENT") return <AlertCircle className="size-3.5 shrink-0 text-red-600" />
  const Icon = priority === "HIGH" ? SignalHigh : priority === "MEDIUM" ? SignalMedium : SignalLow
  return <Icon className={chipIcon} />
}

function DueDateChip({
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
        <button type="button" className={cn(chipBase, "transition-colors hover:bg-muted/60")}>
          <CalendarIcon className={chipIcon} />
          {value ? formatDueDate(value) : "Due date"}
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear due date"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation()
                  onChange(undefined)
                }
              }}
              className="-mr-1 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      {/* Portal to body — escapes overflow:hidden on dialog */}
      <PopoverContent className="w-auto p-0" align="start" avoidCollisions collisionPadding={8}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
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
  /** Fixes the project new tasks are created in. Without it, the dialog lets you pick one (or none). */
  projectId?: string
  /** Pre-selects the status when creating from a status group's "+" button. Still editable. */
  defaultStatus?: TaskStatus
}

export function TaskDialog({
  open,
  onOpenChange,
  mode,
  task,
  onSuccess,
  projectId,
  defaultStatus,
}: TaskDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: "",
      status: "TODO",
      priority: "MEDIUM",
      labels: [],
      dueDate: undefined,
    },
  })

  const watchedLabels = form.watch("labels") ?? []
  const [submitting, setSubmitting] = React.useState(false)
  const [createMore, setCreateMore] = React.useState(false)
  const [pickedProjectId, setPickedProjectId] = React.useState<string>("")
  const [subtasks, setSubtasks] = React.useState<string[]>([])
  const [subtaskDraft, setSubtaskDraft] = React.useState("")
  const isEdit = mode === "edit"
  const projectLocked = isEdit || Boolean(projectId)
  const taskProjectId = (isEdit ? task?.projectId : (projectId ?? (pickedProjectId || undefined))) ?? undefined

  const { projects } = useProjectList()
  const projectName = projects.find((p) => p.id === taskProjectId)?.name ?? task?.project ?? null

  // Assignable people are scoped to the task's project members; a task with no
  // project falls back to the full workspace roster. Cached, so reopening the
  // dialog (or opening a task panel on the same project) is instant.
  const { data: membersList = [] } = useAssignableMembers(taskProjectId ?? null, undefined, { enabled: open })

  React.useEffect(() => {
    if (!open) return
    setSubtasks([])
    setSubtaskDraft("")
    setPickedProjectId("")
    if (isEdit && task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        assigneeId: task.assigneeId ?? "",
        status: task.status,
        priority: task.priority,
        labels: task.labels,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      })
    } else {
      form.reset({
        title: "",
        description: "",
        assigneeId: "",
        status: defaultStatus ?? "TODO",
        priority: "MEDIUM",
        labels: [],
        dueDate: undefined,
      })
    }
  }, [open, task, isEdit, form, defaultStatus])

  // An assignee from another project's roster isn't valid after switching projects.
  React.useEffect(() => {
    const current = form.getValues("assigneeId")
    if (current && membersList.length > 0 && !membersList.some((m) => m.userId === current)) {
      form.setValue("assigneeId", "")
    }
  }, [membersList, form])

  async function onSubmit(data: FormValues) {
    if (submitting) return
    setSubmitting(true)
    try {
      if (isEdit && task) {
        await updateTask(task.id, {
          title: data.title,
          description: data.description ?? "",
          assigneeId: data.assigneeId || null,
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          labels: data.labels ?? [],
          dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
        })
      } else {
        const created = await createTask({
          title: data.title,
          description: data.description ?? "",
          projectId: taskProjectId,
          assigneeId: data.assigneeId || undefined,
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          labels: data.labels ?? [],
          dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : null,
        })
        // Subtasks are ordinary tasks pointing at the parent.
        await Promise.all(
          subtasks.map((title) =>
            createTask({ title, projectId: taskProjectId, parentTaskId: created.id, status: "TODO" })
          )
        )
      }
      onSuccess?.()
      if (!isEdit && createMore) {
        // Keep the context (project, status, priority, assignee); clear what is per-task.
        form.reset({ ...form.getValues(), title: "", description: "", labels: [], dueDate: undefined })
        setSubtasks([])
        setSubtaskDraft("")
        form.setFocus("title")
      } else {
        form.reset()
        onOpenChange(false)
      }
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

  function commitSubtask() {
    const title = subtaskDraft.trim()
    if (!title) return
    setSubtasks((prev) => [...prev, title])
    setSubtaskDraft("")
  }

  const status = form.watch("status")
  const priority = form.watch("priority")

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
          title={isEdit ? "Edit task" : "New task"}
          description={isEdit ? "Update the task details." : "Create a new task and add the essential details."}
        />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={submitOnModEnter(() => void form.handleSubmit(onSubmit)())}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={formDialogBodyClass}>
            <div className="space-y-1.5">
              <Input
                autoFocus
                placeholder="Task name"
                aria-label="Task name"
                className={formNameFieldClass}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-[13px] text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <Textarea
              placeholder="Add a description… (optional)"
              aria-label="Description"
              className={formDescriptionFieldClass}
              {...form.register("description")}
            />

            {/* Property chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {projectLocked ? (
                <span className={chipBase}>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      taskProjectId ? projectDot(taskProjectId) : "bg-muted-foreground/50"
                    )}
                  />
                  {projectName ?? "No project"}
                </span>
              ) : (
                <Select
                  value={pickedProjectId || NO_VALUE}
                  onValueChange={(v) => setPickedProjectId(v === NO_VALUE ? "" : v)}
                >
                  <SelectTrigger className={chipTrigger} aria-label="Project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        No project
                      </span>
                    </SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="inline-flex items-center gap-2">
                          <span className={cn("size-1.5 shrink-0 rounded-full", projectDot(p.id))} />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={status} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger className={chipTrigger} aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className={cn("size-3.5 shrink-0", STATUS_ICON_CLASS[opt.value])} />
                          {opt.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* "" shows the placeholder; the Unassigned item maps back to "". */}
              <Select
                value={form.watch("assigneeId") || ""}
                onValueChange={(v) => form.setValue("assigneeId", v === NO_VALUE ? "" : v)}
              >
                <SelectTrigger className={chipTrigger} aria-label="Assignee">
                  <SelectValue
                    placeholder={
                      <span className="inline-flex items-center gap-2">
                        <UserRound className={chipIcon} />
                        Assignee
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_VALUE}>
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                      Unassigned
                    </span>
                  </SelectItem>
                  {membersList.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      <span className="inline-flex items-center gap-2">
                        <PersonAvatar name={m.name} image={m.avatar} className="size-4.5 ring-0" />
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={(v) => form.setValue("priority", v)}>
                <SelectTrigger className={chipTrigger} aria-label="Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="inline-flex items-center gap-2">
                        <PriorityIcon priority={opt.value} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DueDateChip value={form.watch("dueDate")} onChange={(date) => form.setValue("dueDate", date)} />

              <LabelMultiSelect
                variant="chip"
                selected={watchedLabels}
                onChange={(labels) => form.setValue("labels", labels)}
              />
            </div>

            {!isEdit && (
              <div>
                <p className="mb-1.5 text-xs leading-[18px] font-medium">Subtasks</p>
                {subtasks.length > 0 && (
                  <ul className="mb-1.5 space-y-1">
                    {subtasks.map((title, i) => (
                      <li
                        key={`${title}-${i}`}
                        className="flex h-7.5 items-center gap-2 rounded-md border border-border px-2.5 text-[13px]"
                      >
                        <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{title}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${title}`}
                          onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="relative">
                  <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        commitSubtask()
                      }
                    }}
                    placeholder="Add a subtask and press Enter"
                    aria-label="Add a subtask"
                    className={cn("h-7.5 rounded-md pl-8 text-[13px] shadow-none md:text-[13px]", formFieldFocus)}
                  />
                </div>
              </div>
            )}
          </div>

          <FormDialogFooter
            createMore={isEdit ? undefined : createMore}
            onCreateMoreChange={isEdit ? undefined : setCreateMore}
            onCancel={handleCancel}
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create task"}
            submittingLabel={isEdit ? "Saving..." : "Creating..."}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
