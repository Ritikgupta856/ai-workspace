import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import {
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type ToolSet,
} from "ai"

import { CHAT_MODEL, reasoningOptions } from "@/lib/ai/models"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findActiveMembership } from "@/lib/api/guards"
import { buildChatContext, type IncomingMessage } from "@/lib/ai/context-builder"
import { planFor, routeChat } from "@/lib/ai/router"
import { resolveWorkspaceTools } from "@/lib/integrations"
import { getWorkspaceReadTools, getWorkspaceWriteTools } from "@/lib/ai/tools/workspace-tools"
import { describeModelError } from "@/lib/ai/model-errors"
import { saveChat } from "@/lib/ai/chat-store"
import { messageText, type ChatUIMessage } from "@/lib/ai/chat-message"

function toIncomingMessage(message: ChatUIMessage): IncomingMessage {
  return {
    role: message.role === "user" ? "user" : "assistant",
    content: messageText(message),
    attachments: message.parts.flatMap((part) =>
      part.type === "file" ? [{ url: part.url, mediaType: part.mediaType, filename: part.filename }] : []
    ),
  }
}

/** A fixed answer that needs no model call, sent in the same stream format as a generated one. */
function reply(text: string) {
  const stream = createUIMessageStream<ChatUIMessage>({
    execute: ({ writer }) => {
      writer.write({ type: "text-start", id: "reply" })
      writer.write({ type: "text-delta", id: "reply", delta: text })
      writer.write({ type: "text-end", id: "reply" })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

export async function POST(req: Request) {
  // Checked before any model call: without it this route is an open,
  // anonymous proxy to our AI Gateway credit.
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // The model is never read from the body — see lib/ai/models.
  const { messages, chatId } = (await req.json()) as {
    messages?: ChatUIMessage[]
    chatId?: string | null
  }

  if (!Array.isArray(messages)) {
    return Response.json(
      { error: "Missing or invalid 'messages' in request body" },
      { status: 400 }
    )
  }

  const history = messages.filter((m) => m.role !== "system").map(toIncomingMessage)

  // Started before the workspace lookup so the router's model call overlaps it.
  const routePromise = routeChat(history)

  let tools: ToolSet | undefined
  let workspaceSystemPrompt: string | undefined
  let cleanupWorkspaceTools: (() => Promise<void>) | undefined
  let workspaceId: string | undefined
  let workspaceName: string | undefined

  // Integration (MCP) connections must close whether the turn succeeds or fails.
  async function releaseTools() {
    const cleanup = cleanupWorkspaceTools
    cleanupWorkspaceTools = undefined
    if (cleanup) await cleanup()
  }

  if (session?.user) {
    // The workspace the user is viewing (see findActiveMembership). Without it,
    // a user in more than one workspace could get tool results and RAG context
    // from a different workspace than the one on screen.
    const membership = await findActiveMembership(session.user.id)

    if (membership) {
      workspaceId = membership.workspaceId
      workspaceName = membership.workspace?.name
    }
  }

  const plan = planFor(await routePromise)

  if (session?.user && workspaceId && plan.tools !== "none") {
    tools = {
      ...getWorkspaceReadTools(workspaceId, session.user.id),
      ...(plan.tools === "read-write" ? getWorkspaceWriteTools(workspaceId, session.user.id) : {}),
    }

    if (plan.integrations === "all" || plan.integrations.length > 0) {
      const result = await resolveWorkspaceTools(workspaceId, {
        userId: session.user.id,
        only: plan.integrations === "all" ? undefined : plan.integrations,
      })
      tools = { ...tools, ...result.tools }
      workspaceSystemPrompt = result.systemPrompt
      cleanupWorkspaceTools = result.cleanup
    }
  }

  const context = await buildChatContext({
    workspaceSystemPrompt,
    messages: history,
    workspaceId,
    retrieve: plan.retrieve,
    viewer: session?.user
      ? { name: session.user.name ?? undefined, workspace: workspaceName }
      : undefined,
  })

  if (context.type === "skip") {
    await releaseTools()
    return reply(context.message)
  }

  const user = session?.user
  let activeChatId: string | undefined

  if (user && workspaceId) {
    const owned = chatId
      ? await prisma.chat.findFirst({
          where: { id: chatId, createdById: user.id },
          select: { id: true },
        })
      : null
    activeChatId = owned?.id ?? randomUUID()
  }

  const result = streamText({
    model: CHAT_MODEL,
    system: context.systemPrompt,
    messages: context.messages,
    tools,
    // Cross-source questions routinely need list → fetch → follow-up chains on
    // two or three sources; 10 steps cut those off mid-investigation.
    stopWhen: stepCountIs(16),
    providerOptions: {
      google: { thinkingConfig: { includeThoughts: true } },
      ...reasoningOptions(CHAT_MODEL, plan.reasoningEffort),
    },
  })

  // Keeps generating when the tab closes mid-answer, so the turn is still saved.
  void result.consumeStream()

  return result.toUIMessageStreamResponse<ChatUIMessage>({
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    sendReasoning: true,
    messageMetadata: ({ part }) =>
      part.type === "start" && context.sources.length > 0 ? { sources: context.sources } : undefined,
    onError: describeModelError,
    onFinish: async ({ messages: finished }) => {
      await releaseTools()
      if (!user || !workspaceId || !activeChatId) return
      try {
        await saveChat({ chatId: activeChatId, userId: user.id, workspaceId, messages: finished })
      } catch (err) {
        console.error("[chat] failed to save conversation:", err)
      }
    },
    headers: activeChatId ? { "X-Chat-Id": activeChatId } : undefined,
  })
}
