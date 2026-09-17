"use client"

import * as React from "react"
import {
  CalendarCheck,
  GitPullRequest,
  ListChecks,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldAlert,
  StickyNote,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { formatUpdatedDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { AgentGlyph } from "./agent-glyph"
import { Composer } from "./composer"
import { useChatContext } from "./chat-provider"

const STARTER_PROMPTS: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Summarise this week", prompt: "Summarize what shipped this week", icon: CalendarCheck },
  { label: "Review my latest PR", prompt: "Review the code in my latest pull request", icon: GitPullRequest },
  { label: "What's blocking the sprint?", prompt: "What's blocking the current sprint?", icon: ShieldAlert },
  { label: "Note → tasks", prompt: "Turn my latest note into tasks", icon: StickyNote },
  { label: "Plan my day", prompt: "Plan my day from my open tasks and deadlines", icon: ListChecks },
]

const CHATS_COLLAPSED = 4

export interface EmptyStateProps {
  greeting: string
  firstName: string
}

export function EmptyState({ greeting, firstName }: EmptyStateProps) {
  const { sendMessage, chats, loadingChats, openChat, deleteChat, refreshChats } = useChatContext()
  const [expanded, setExpanded] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const visibleChats = expanded ? chats : chats.slice(0, CHATS_COLLAPSED)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshChats()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Hero */}
      <section className="flex flex-col items-center px-5 pt-20 pb-10 sm:pt-24">
        {/* Instrument Serif is condensed, so a little positive tracking opens it up. */}
        <h1 className="font-serif text-3xl tracking-[0.04em] text-foreground sm:text-[38px] sm:leading-tight">
          {greeting}, <span className="text-primary">{firstName}</span>
        </h1>
        <p className="mt-2.5 text-[13px] text-muted-foreground">
          I&apos;m Synapse, where should we start today?
        </p>

        <div className="mt-9 w-full max-w-4xl">
          <Composer variant="centered" />
        </div>

        <div className="mt-4 flex w-full max-w-4xl flex-wrap justify-center gap-2.5">
          {STARTER_PROMPTS.map(({ label, prompt, icon: Icon }) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-card px-3 text-[13px] text-foreground/90 transition-colors hover:border-border hover:bg-accent/40"
            >
              <Icon className="size-3.5 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Previous chats */}
      <section className="mt-auto px-5 pt-12 pb-8 sm:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-foreground">
            Previous chats{" "}
            <span className="font-normal text-muted-foreground">({chats.length})</span>
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
            <span className="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              disabled={chats.length <= CHATS_COLLAPSED}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {loadingChats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: CHATS_COLLAPSED }).map((_, i) => (
              <div key={i} className="h-21 animate-pulse rounded-lg border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-[13px] text-muted-foreground">
            Conversations you start will show up here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleChats.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => openChat(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    openChat(chat.id)
                  }
                }}
                className="group flex h-21 cursor-pointer flex-col justify-between rounded-lg border border-border/80 bg-card p-4 text-left transition-colors hover:border-border hover:bg-accent/30"
              >
                <div className="flex items-center justify-between">
                  <AgentGlyph />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatUpdatedDate(chat.updatedAt)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${chat.title ?? "chat"}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="truncate text-[13px] text-foreground/90">
                  {chat.title ?? "Untitled chat"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
