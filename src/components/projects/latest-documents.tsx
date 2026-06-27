"use client"

import * as React from "react"
import { FileText, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentItemData {
  id: string
  name: string
  updatedAt: string
}

const documents: DocumentItemData[] = [
  { id: "d1", name: "Q3 Roadmap.md", updatedAt: "2 hours ago" },
  { id: "d2", name: "API Design Spec.pdf", updatedAt: "Yesterday" },
  { id: "d3", name: "User Research Findings.docx", updatedAt: "2 days ago" },
  { id: "d4", name: "Architecture Overview.png", updatedAt: "3 days ago" },
]

export function LatestDocuments() {
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
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-4 text-muted-foreground" />
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
