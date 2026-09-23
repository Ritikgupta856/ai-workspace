import { generateText, Output } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { isSmallTalk, isWorkspaceAction } from "@/lib/ai/intent"
import { INTEGRATIONS } from "@/lib/integrations/config"

/**
 * Decides what a chat turn needs before any expensive work starts, so the
 * agent only pays for retrieval, tools and integration handshakes when the
 * message calls for them.
 *
 * The small model runs in parallel with the session/workspace lookup. It is an
 * optimisation, never a gate: on timeout or error the turn falls back to the
 * full pipeline, so a slow router can't make a turn worse than no router.
 */

const ROUTER_MODEL = "gemini-3.5-flash-lite"
/**
 * Measured 1.2–2.5s warm, ~2.6s on a cold connection, and 11–22s spikes when
 * the free-tier limit (15 requests/min, shared with the chat model) throttles
 * it; past this, run everything.
 */
const ROUTER_TIMEOUT_MS = 3000

const SOURCES = ["knowledge_base", ...INTEGRATIONS.map((i) => i.id)] as [string, ...string[]]

const routeSchema = z.object({
  intent: z.enum(["conversation", "general_knowledge", "workspace", "action"]),
  sources: z.array(z.enum(SOURCES)),
})

export type ChatRoute = z.infer<typeof routeSchema>

const ROUTER_PROMPT = `You route messages for Synapse, an AI agent inside a team's workspace. Classify the LATEST user message; earlier turns are context for follow-ups only.

intent:
- conversation: greetings, chit-chat, feedback or insults, questions about the assistant itself.
- general_knowledge: answerable without this team's data — explain a concept, write code or a regex, draft generic text.
- workspace: needs this team's own information — docs, notes, pages, tasks, projects, code, issues, designs.
- action: asks to create, update or assign something, including confirming ("yes", "do it") an action the assistant just proposed.

sources (workspace and action only; empty otherwise):
- knowledge_base: the team's documents, notes, pages and uploaded files — how things work, decisions, specs.
- ${INTEGRATIONS.map((i) => i.id).join(" / ")}: only when the message is about that tool's content (repositories, code, pull requests and issues; Notion pages; Linear issues; Figma designs).

If unsure between conversation/general_knowledge and workspace, choose workspace.`

type RouterMessage = { role: string; content?: string; attachments?: unknown[] }

/** User turns keep their start; assistant turns keep their end, where a proposed action sits. */
function transcript(messages: RouterMessage[]) {
  return messages
    .slice(-4)
    .map(({ role, content = "" }) => {
      const text =
        role === "user"
          ? content.slice(0, 1000)
          : content.length > 600
            ? `…${content.slice(-600)}`
            : content
      return `${role}: ${text}`
    })
    .join("\n\n")
}

/** `null` means "couldn't decide" — run the full pipeline. */
export async function routeChat(messages: RouterMessage[]): Promise<ChatRoute | null> {
  const last = [...messages].reverse().find((m) => m.role === "user")
  if (!last) return null

  // Attached documents are handled by the context builder's document path.
  if (last.attachments?.length) return null

  const text = last.content ?? ""
  if (isSmallTalk(text)) {
    console.log(`[router] 💬 small talk "${text.slice(0, 40)}" — no retrieval or tools`)
    return { intent: "conversation", sources: [] }
  }

  if (isWorkspaceAction(text)) {
    const sources = INTEGRATIONS.map((i) => i.id).filter((id) => new RegExp(`\\b${id}\\b`, "i").test(text))
    console.log(
      `[router] ✍️ action "${text.slice(0, 40)}" — write tools${sources.length ? ` + ${sources.join(", ")}` : ""}, no retrieval`
    )
    return { intent: "action", sources }
  }

  const startedAt = Date.now()
  try {
    const { output } = await generateText({
      model: google(ROUTER_MODEL),
      system: ROUTER_PROMPT,
      prompt: `Conversation, latest message last:\n\n${transcript(messages)}`,
      output: Output.object({ schema: routeSchema }),
      abortSignal: AbortSignal.timeout(ROUTER_TIMEOUT_MS),
      maxRetries: 0,
      // Classification needs no reasoning; measured median 2.3s → 1.7s.
      providerOptions: { google: { thinkingConfig: { thinkingLevel: "minimal" } } },
    })
    console.log(
      `[router] 🧭 intent=${output.intent} sources=[${output.sources.join(", ")}] in ${Date.now() - startedAt}ms`
    )
    return output
  } catch (err) {
    console.log(
      `[router] ⏱️ no route after ${Date.now() - startedAt}ms (${err instanceof Error ? err.name : "error"}) — running the full pipeline`
    )
    return null
  }
}

export type ChatPlan = {
  /** Auto-RAG over the knowledge base before the model runs. */
  retrieve: boolean
  tools: "none" | "read" | "read-write"
  /** Integration ids to connect, or every connected one. */
  integrations: string[] | "all"
}

export function planFor(route: ChatRoute | null): ChatPlan {
  if (!route) return { retrieve: true, tools: "read-write", integrations: "all" }

  if (route.intent === "conversation" || route.intent === "general_knowledge") {
    return { retrieve: false, tools: "none", integrations: [] }
  }

  // Native read tools stay on for any workspace turn: they cost no I/O until
  // called and let the model dig past what retrieval surfaced.
  return {
    retrieve: route.sources.includes("knowledge_base"),
    tools: route.intent === "action" ? "read-write" : "read",
    integrations: route.sources.filter((s) => s !== "knowledge_base"),
  }
}
