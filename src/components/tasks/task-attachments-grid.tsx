"use client"

import * as React from "react"
import {
  FileText,
  Image,
  FileArchive,
  File,
  Download,
  FileCode,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatUpdatedDate, formatCreatedDate } from "@/lib/date"

interface Attachment {
  id: string
  name: string
  size: string
  uploadedBy: string
  uploadedAt: string
  type: "image" | "pdf" | "markdown" | "zip" | "code" | "other"
}

interface TaskAttachmentsGridProps {
  attachments: Attachment[]
}

const attachmentIcons = {
  image: Image,
  pdf: FileText,
  markdown: FileCode,
  zip: FileArchive,
  code: FileCode,
  other: File,
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TaskAttachmentsGrid({ attachments }: TaskAttachmentsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {attachments.map((attachment) => {
        const Icon = attachmentIcons[attachment.type]
        return (
          <div
            key={attachment.id}
            className="group rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow"
          >
            <div className="mb-3 flex items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-6 text-muted-foreground" />
              </div>
            </div>
            <div className="text-center">
              <p className="truncate text-sm font-medium text-foreground">
                {attachment.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {attachment.size}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[8px]">
                    {getInitials(attachment.uploadedBy)}
                  </AvatarFallback>
                </Avatar>
                <span>{formatUpdatedDate(attachment.uploadedAt)}</span>
              </div>
            </div>
            <div className="mt-3 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
