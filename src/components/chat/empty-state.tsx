"use client"

import { Composer } from "./composer"
import { useChatContext } from "./chat-provider"

const STARTER_PROMPTS = [
  "Summarize what shipped this week",
  "Review the code in my latest pull request",
  "What's blocking the current sprint?",
  "Turn my latest note into tasks",
]

export function EmptyState() {
  const { sendMessage } = useChatContext()

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
      <div className="w-full max-w-3xl">
        <Composer variant="centered" />

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground rounded-full border bg-background px-3.5 py-1.5 text-[13px] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
