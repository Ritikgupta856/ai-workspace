"use client"

import {
  CalendarCheck,
  GitPullRequest,
  ListChecks,
  ShieldAlert,
  StickyNote,
  type LucideIcon,
} from "lucide-react"

import { Composer } from "./composer"
import { useChatContext } from "./chat-provider"

const STARTER_PROMPTS: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Summarise this week", prompt: "Summarize what shipped this week", icon: CalendarCheck },
  { label: "Review my latest PR", prompt: "Review the code in my latest pull request", icon: GitPullRequest },
  { label: "What's blocking the sprint?", prompt: "What's blocking the current sprint?", icon: ShieldAlert },
  { label: "Note → tasks", prompt: "Turn my latest note into tasks", icon: StickyNote },
  { label: "Plan my day", prompt: "Plan my day from my open tasks and deadlines", icon: ListChecks },
]

export interface EmptyStateProps {
  greeting: string
  firstName: string
}

export function EmptyState({ greeting, firstName }: EmptyStateProps) {
  const { sendMessage } = useChatContext()

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-16">
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
    </div>
  )
}
