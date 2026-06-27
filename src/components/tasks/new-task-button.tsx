"use client"

import * as React from "react"
import {
  Plus,
  ChevronDown,
  Sparkles,
  Upload,
  FileText,
  Copy,
  Database,
  Settings,
  LayoutTemplate,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface NewTaskButtonProps {
  onNewTask: () => void
}

export function NewTaskButton({ onNewTask }: NewTaskButtonProps) {
  return (
    <DropdownMenu>
      <div className="inline-flex items-center">
        <Button
          onClick={onNewTask}
          className="rounded-r-none shadow-none"
        >
          <Plus className="size-4" />
          <span>New Task</span>
        </Button>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-l-none border-l border-primary-foreground/20 px-2 shadow-none">
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onNewTask}>
          <Plus className="size-4" />
          New Task
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Sparkles className="size-4" />
          New AI Task
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Upload className="size-4" />
          Import Tasks
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LayoutTemplate className="size-4" />
          Create from Template
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="size-4" />
          Duplicate Last Task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Database className="size-4" />
          Bulk Import CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <FileText className="size-4" />
          Manage Templates
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-4" />
          Task Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
