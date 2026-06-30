"use client"

import * as React from "react"
import { FileText, ChevronRight, MoreHorizontal, FileImage, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface DocumentItem {
  id: string
  name: string
  contentType: string
  updatedAt: string
}

const contentTypeIcon: Record<string, React.ReactNode> = {
  DOC: <FileText className="size-4 text-blue-600" />,
  ISSUE: <FileCode className="size-4 text-red-600" />,
  PR: <FileCode className="size-4 text-emerald-600" />,
  NOTE: <FileText className="size-4 text-violet-600" />,
  CHAT: <FileText className="size-4 text-amber-600" />,
  CODE: <FileCode className="size-4 text-cyan-600" />,
}

export function LatestDocuments({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Latest Documents</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          No documents yet. Upload your first document.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Latest Documents</h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          View All
          <ChevronRight className="size-3" />
        </Button>
      </div>
      <div className="space-y-1">
        {documents.slice(0, 5).map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                {contentTypeIcon[doc.contentType] || <FileText className="size-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.updatedAt}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem>Download</DropdownMenuItem>
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}
