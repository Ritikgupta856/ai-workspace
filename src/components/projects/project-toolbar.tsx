"use client"

import * as React from "react"
import { LayoutList, Columns3 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROJECT_STATUS_CONFIG } from "@/lib/constants"

export type ProjectSortKey = "name" | "updated" | "progress"

export interface ProjectToolbarProps {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  sortBy: ProjectSortKey
  onSortChange: (value: ProjectSortKey) => void
  viewMode: "grid" | "list"
  onViewModeChange: (value: "grid" | "list") => void
}

export function ProjectToolbar({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ProjectToolbarProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-9 w-36 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(v) => onSortChange(v as ProjectSortKey)}>
        <SelectTrigger className="h-9 w-40 text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="updated">Recently Updated</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
        </SelectContent>
      </Select>

      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as "grid" | "list")}>
        <TabsList className="h-9">
          <TabsTrigger value="list" className="gap-2 px-3">
            <LayoutList className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2 px-3">
            <Columns3 className="size-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
