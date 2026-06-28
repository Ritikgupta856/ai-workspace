"use client"

import * as React from "react"
import {
  GitPullRequest,
  GitCommit,
  AlertCircle,
  FileText,
  BookOpen,
  ExternalLink,
  ListTodo,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LinkedItem {
  id: string
  title: string
  type: "pr" | "issue" | "commit" | "document" | "knowledge" | "task"
  url?: string
  metadata?: string
}

interface TaskLinkedItemsProps {
  items: LinkedItem[]
}

const sectionIcons = {
  pr: GitPullRequest,
  issue: AlertCircle,
  commit: GitCommit,
  document: FileText,
  knowledge: BookOpen,
  task: ListTodo,
}

export function TaskLinkedItems({ items }: TaskLinkedItemsProps) {
  const sections = React.useMemo(() => {
    const map: Record<string, { icon: typeof GitPullRequest; label: string; items: LinkedItem[] }> = {
      pr: { icon: GitPullRequest, label: "GitHub", items: [] },
      issue: { icon: AlertCircle, label: "GitHub", items: [] },
      commit: { icon: GitCommit, label: "GitHub", items: [] },
      document: { icon: FileText, label: "Documents", items: [] },
      knowledge: { icon: BookOpen, label: "Knowledge", items: [] },
      task: { icon: ListTodo, label: "Related Tasks", items: [] },
    }

    for (const item of items) {
      if (map[item.type]) {
        map[item.type].items.push(item)
      }
    }

    return Object.entries(map)
      .filter(([_, section]) => section.items.length > 0)
      .map(([key, section]) => ({
        key,
        label: section.label,
        Icon: section.icon,
        items: section.items,
      }))
  }, [items])

  return (
    <div className="space-y-6">
      {sections.map(({ key, label, Icon, items }) => (
        <div key={key}>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="size-4 text-muted-foreground" />
            {label}
          </h4>
          <div className="space-y-1.5">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-accent/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {key === "pr" && (
                    <GitPullRequest className="size-4 text-green-600" />
                  )}
                  {key === "issue" && (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                  {key === "commit" && (
                    <GitCommit className="size-4 text-muted-foreground" />
                  )}
                  {key === "document" && (
                    <FileText className="size-4 text-blue-600" />
                  )}
                  {key === "knowledge" && (
                    <BookOpen className="size-4 text-purple-600" />
                  )}
                  {key === "task" && (
                    <ListTodo className="size-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  {item.metadata && (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.metadata}
                    </p>
                  )}
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
