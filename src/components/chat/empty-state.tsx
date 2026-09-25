"use client"

import {
  CalendarCheck,
  FileText,
  GitPullRequest,
  ListChecks,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react"

import { Suggestion } from "@/components/ai-elements/suggestion"
import { Composer } from "./composer"
import { useChatContext } from "./chat-provider"

const STARTER_PROMPTS: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Summarise this week", prompt: "Summarize what shipped this week", icon: CalendarCheck },
  { label: "Review my latest PR", prompt: "Review the code in my latest pull request", icon: GitPullRequest },
  { label: "What's blocking the sprint?", prompt: "What's blocking the current sprint?", icon: ShieldAlert },
  { label: "Page → tasks", prompt: "Turn my latest page into tasks", icon: FileText },
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
      <h1 className="text-[28px] leading-9 font-medium tracking-[-0.02em] text-foreground sm:text-[32px] sm:leading-10">
        {greeting}, <span className="text-primary">{firstName}</span>
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        I&apos;m Synapse, where should we start today?
      </p>

      <div className="mt-9 w-full max-w-4xl">
        <Composer variant="centered" />
      </div>

      <div className="mt-4 flex w-full max-w-4xl flex-wrap justify-center gap-2.5">
        {STARTER_PROMPTS.map(({ label, prompt, icon: Icon }) => (
          <Suggestion
            key={prompt}
            suggestion={prompt}
            onClick={sendMessage}
            className="h-9 gap-2 rounded-lg border-border/80 bg-card px-3 text-[13px] font-normal text-foreground/90 shadow-none hover:border-border hover:bg-accent/40"
          >
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
          </Suggestion>
        ))}
      </div>
    </div>
  )
}
