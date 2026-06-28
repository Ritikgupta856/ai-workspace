"use client"

import * as React from "react"
import { Sparkles, Copy, Check, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const suggestedActions = [
  { label: "Summarize Task", icon: Sparkles },
  { label: "Generate Subtasks", icon: Sparkles },
  { label: "Explain Related Code", icon: Sparkles },
  { label: "Review Linked PR", icon: Sparkles },
  { label: "Estimate Effort", icon: Sparkles },
  { label: "Generate Test Cases", icon: Sparkles },
  { label: "Find Similar Tasks", icon: Sparkles },
  { label: "Create Implementation Plan", icon: Sparkles },
]

interface AIResponse {
  id: string
  content: string
  sources: string[]
  action: string
}

export function AIPanel() {
  const [query, setQuery] = React.useState("")
  const [responses, setResponses] = React.useState<AIResponse[]>([])
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  function handleAction(action: string) {
    setResponses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        content: `## ${action}\n\nThis is a simulated AI response for the "${action}" action. In production, this would be powered by an actual AI model connected to your task context, project data, and codebase.\n\n\`\`\`typescript\n// Example generated content\nfunction analyzeTask(task: Task) {\n  const summary = await ai.summarize(task)\n  return summary\n}\n\`\`\`\n\nHere are some key findings:\n\n1. The authentication flow uses JWT tokens with refresh rotation\n2. The staging environment has a known rate-limiting issue\n3. Related code is in \`src/lib/auth.ts\` and \`src/middleware.ts\``,
        sources: ["auth-flow.ts", "middleware.ts", "api-routes.ts"],
        action,
      },
    ])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    handleAction(query.trim())
    setQuery("")
  }

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="relative">
        <Sparkles className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ask AI about this task..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 rounded-2xl border bg-card pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        {suggestedActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => handleAction(action.label)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Icon className="size-3" />
              {action.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {responses.map((response) => (
          <div
            key={response.id}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {response.action}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(response.content, response.id)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
              >
                {copiedId === response.id ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {response.content.split("```").map((part, i) => {
                  if (i % 2 === 1) {
                    const [lang, ...code] = part.split("\n")
                    return (
                      <pre
                        key={i}
                        className="my-3 overflow-x-auto rounded-xl border bg-muted p-4 text-xs"
                      >
                        <code className="text-foreground">
                          {code.join("\n")}
                        </code>
                      </pre>
                    )
                  }
                  return (
                    <span key={i} className="whitespace-pre-wrap">
                      {part}
                      {i < response.content.split("```").length - 1 && (
                        <br />
                      )}
                    </span>
                  )
                })}
              </div>
            </div>

            {response.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Sources:</span>
                {response.sources.map((source) => (
                  <Badge
                    key={source}
                    variant="secondary"
                    className="text-[11px] font-normal"
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
