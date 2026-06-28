"use client"

import * as React from "react"
import { CalendarDays, User, Clock } from "lucide-react"
import { formatDateTime, formatCreatedDate } from "@/lib/date"

interface TaskDescriptionCardProps {
  description: string
  acceptanceCriteria: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export function TaskDescriptionCard({
  description,
  acceptanceCriteria,
  createdBy,
  createdAt,
  updatedAt,
}: TaskDescriptionCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="prose prose-sm max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {description}
        </div>
      </div>

      {acceptanceCriteria && (
        <>
          <hr className="my-5 border-border" />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Acceptance Criteria
            </h3>
            <ul className="space-y-1.5">
              {acceptanceCriteria.split("\n").filter(Boolean).map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {item.replace(/^[-*]\s*/, "")}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <hr className="my-5 border-border" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="size-3" />
          Created by {createdBy}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3" />
          {formatCreatedDate(createdAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3" />
          Updated {formatDateTime(updatedAt)}
        </span>
      </div>
    </div>
  )
}
