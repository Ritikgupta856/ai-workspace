"use client"

import { useState } from "react"
import {
  getToolOrDynamicToolName,
  type DynamicToolUIPart,
  type ReasoningUIPart,
  type ToolUIPart,
} from "ai"
import {
  BrainIcon,
  FileTextIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"
import { Streamdown } from "streamdown"

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import { Shimmer } from "@/components/ai-elements/shimmer"

export type AgentStepPart = ReasoningUIPart | ToolUIPart | DynamicToolUIPart

type ToolPart = ToolUIPart | DynamicToolUIPart

/** Leading verbs of our own tools and most MCP ones: `search_tasks` reads as "Searched tasks". */
const VERBS: Record<string, { icon: LucideIcon; active: string; done: string }> = {
  search: { icon: SearchIcon, active: "Searching", done: "Searched" },
  find: { icon: SearchIcon, active: "Finding", done: "Found" },
  get: { icon: FileTextIcon, active: "Reading", done: "Read" },
  read: { icon: FileTextIcon, active: "Reading", done: "Read" },
  fetch: { icon: FileTextIcon, active: "Fetching", done: "Fetched" },
  list: { icon: ListIcon, active: "Listing", done: "Listed" },
  create: { icon: PlusIcon, active: "Creating", done: "Created" },
  update: { icon: PencilIcon, active: "Updating", done: "Updated" },
  delete: { icon: Trash2Icon, active: "Deleting", done: "Deleted" },
}

const TOOL_DONE_STATES = new Set<ToolPart["state"]>(["output-available", "output-error", "output-denied"])

function describeTool(name: string) {
  const [first = "", ...rest] = name.replace(/[_-]+/g, " ").trim().split(/\s+/)
  const verb = VERBS[first.toLowerCase()]
  if (verb && rest.length > 0) {
    const object = rest.join(" ")
    return { icon: verb.icon, active: `${verb.active} ${object}`, done: `${verb.done} ${object}` }
  }
  const title = [first, ...rest].join(" ")
  const label = title.charAt(0).toUpperCase() + title.slice(1)
  return { icon: WrenchIcon, active: `Running ${title}`, done: label }
}

const doneLabel = (part: AgentStepPart) =>
  part.type === "reasoning" ? "Thought" : describeTool(getToolOrDynamicToolName(part)).done

const isToolRunning = (part: ToolPart) => !TOOL_DONE_STATES.has(part.state)

/** Free-text inputs and filters, shown as chips; opaque ids (`taskId`, `id`) say nothing to a reader. */
function inputChips(input: unknown) {
  if (!input || typeof input !== "object") return []
  return Object.entries(input)
    .flatMap(([key, value]) =>
      typeof value === "string" && value.trim() && !/(^|_)ids?$|[a-z]Ids?$/.test(key) ? [value.trim()] : []
    )
    .slice(0, 4)
}

const REASONING_TEXT =
  "text-[13px] leading-6 text-muted-foreground [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_strong]:font-medium [&_strong]:text-foreground/80"

function ReasoningStep({ part, isRunning }: { part: ReasoningUIPart; isRunning: boolean }) {
  return (
    <ChainOfThoughtStep
      icon={BrainIcon}
      status={isRunning ? "active" : "complete"}
      label={isRunning ? <Shimmer as="span">Thinking…</Shimmer> : "Thought"}
    >
      <div className={REASONING_TEXT}>
        <Streamdown>{part.text}</Streamdown>
      </div>
    </ChainOfThoughtStep>
  )
}

function ToolStep({ part, isRunning }: { part: ToolPart; isRunning: boolean }) {
  const { icon, active, done } = describeTool(getToolOrDynamicToolName(part))
  const chips = inputChips(part.input)
  const description =
    part.state === "output-error"
      ? part.errorText || "Failed"
      : part.state === "output-denied"
        ? "Denied"
        : undefined

  return (
    <ChainOfThoughtStep
      icon={icon}
      status={isRunning ? "active" : "complete"}
      label={isRunning ? <Shimmer as="span">{`${active}…`}</Shimmer> : done}
      description={description}
    >
      {chips.length > 0 && (
        <ChainOfThoughtSearchResults>
          {chips.map((chip) => (
            <ChainOfThoughtSearchResult key={chip} className="max-w-64">
              <span className="truncate">{chip}</span>
            </ChainOfThoughtSearchResult>
          ))}
        </ChainOfThoughtSearchResults>
      )}
    </ChainOfThoughtStep>
  )
}

/**
 * One run of the agent's reasoning and tool calls, as a single timeline. It
 * opens while the run is in progress and folds away once the answer starts, so
 * the answer stays the first thing you read.
 */
export function AgentSteps({ parts, isActive }: { parts: AgentStepPart[]; isActive: boolean }) {
  const [open, setOpen] = useState(isActive)
  const [wasActive, setWasActive] = useState(isActive)
  if (wasActive !== isActive) {
    setWasActive(isActive)
    setOpen(isActive)
  }

  const current = parts.at(-1)
  // Between a tool's result and the model's next move, the agent is thinking.
  const activeLabel =
    current && current.type !== "reasoning" && isToolRunning(current)
      ? describeTool(getToolOrDynamicToolName(current)).active
      : "Thinking"
  const header = isActive ? (
    <Shimmer as="span">{`${activeLabel}…`}</Shimmer>
  ) : parts.length === 1 && current ? (
    doneLabel(current)
  ) : (
    `Worked through ${parts.length} steps`
  )

  return (
    <ChainOfThought open={open} onOpenChange={setOpen} className="space-y-0">
      <ChainOfThoughtHeader>{header}</ChainOfThoughtHeader>
      <ChainOfThoughtContent className="mt-3">
        {parts.map((part, index) => {
          // Only the newest step can still be running, and only while the run is.
          const isRunning = isActive && index === parts.length - 1
          return part.type === "reasoning" ? (
            <ReasoningStep key={index} part={part} isRunning={isRunning && part.state === "streaming"} />
          ) : (
            <ToolStep
              key={part.toolCallId}
              part={part}
              isRunning={isRunning && isToolRunning(part)}
            />
          )
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  )
}
