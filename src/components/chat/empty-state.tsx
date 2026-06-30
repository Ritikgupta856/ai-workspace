"use client"

import { useChatContext } from "./chat-provider"

const STARTER_PROMPTS = [
  { label: "Summarize a document", icon: "📄" },
  { label: "Plan a project", icon: "📋" },
  { label: "Generate tasks", icon: "✅" },
  { label: "Review GitHub repository", icon: "💻" },
  { label: "Explain my notes", icon: "📝" },
  { label: "Brainstorm ideas", icon: "💡" },
]

export function EmptyState() {
  const { sendMessage } = useChatContext()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="size-8 text-primary"
            aria-hidden="true"
          >
            <path
              d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M16 6c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6z"
              fill="currentColor"
              opacity="0.4"
            />
            <path
              d="M16 10c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          What would you like to build today?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask me anything, or try one of these examples
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            onClick={() => sendMessage(prompt.label)}
            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-foreground/20"
          >
            <span aria-hidden="true">{prompt.icon}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
