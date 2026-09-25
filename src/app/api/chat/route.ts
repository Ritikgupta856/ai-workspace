import { streamText, stepCountIs, type ToolSet } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { buildChatContext } from "@/lib/ai/context-builder"
import { planFor, routeChat } from "@/lib/ai/router"
import { resolveWorkspaceTools } from "@/lib/integrations"
import { getWorkspaceReadTools, getWorkspaceWriteTools } from "@/lib/ai/tools/workspace-tools"
import { describeModelError, INTERRUPTED_NOTE, NO_OUTPUT_ERROR } from "@/lib/ai/model-errors"

/** First line of the opening question, used as the chat's title until renamed. */
function deriveTitle(text: string) {
  const firstLine = text.trim().split("\n")[0].trim()
  if (!firstLine) return "New chat"
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine
}

export async function POST(req: Request) {
  const { provider, model, messages, chatId } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return Response.json(
      { error: "Missing or invalid 'messages' in request body" },
      { status: 400 }
    )
  }

  // Started before the session lookup so the router's model call overlaps it.
  const routePromise = routeChat(messages)

  const session = await auth.api.getSession({
    headers: await headers(),
  })

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

  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user")

  if (session?.user) {
    // Mirrors the activeWorkspaceId-cookie pattern used by /api/settings and
    // /api/billing — without it, a user in more than one workspace could get
    // tool results and RAG context bound to whichever membership row Postgres
    // happened to return first, not the workspace they're currently viewing.
    const cookieStore = await cookies()
    const activeWorkspaceId = cookieStore.get("activeWorkspaceId")?.value

    const membership =
      (activeWorkspaceId
        ? await prisma.workspaceMember.findFirst({
            where: { userId: session.user.id, workspaceId: activeWorkspaceId },
            select: { workspaceId: true, workspace: { select: { name: true } } },
          })
        : null) ??
      (await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true, workspace: { select: { name: true } } },
      }))

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
    messages,
    workspaceId,
    retrieve: plan.retrieve,
    viewer: session?.user
      ? { name: session.user.name ?? undefined, workspace: workspaceName }
      : undefined,
  })

  if (context.type === "skip") {
    await releaseTools()
    return Response.json({ message: context.message })
  }

  // Persistence runs server-side so a closed tab or a navigation mid-stream
  // still leaves a complete exchange in history.
  let activeChatId: string | undefined
  let createdChatId: string | undefined
  let savedUserMessageId: string | undefined

  // A turn the model never answered is not kept: the client shows the error
  // and offers a retry, which would otherwise store the question twice.
  async function discardTurn() {
    try {
      if (createdChatId) {
        await prisma.chat.delete({ where: { id: createdChatId } })
      } else if (savedUserMessageId) {
        await prisma.message.delete({ where: { id: savedUserMessageId } })
      }
    } catch (err) {
      console.error("[chat] failed to discard unanswered turn:", err)
    }
  }

  if (session?.user && workspaceId) {
    if (chatId) {
      const owned = await prisma.chat.findFirst({
        where: { id: chatId, createdById: session.user.id },
        select: { id: true },
      })
      activeChatId = owned?.id
    }

    if (!activeChatId) {
      const created = await prisma.chat.create({
        data: {
          workspaceId,
          createdById: session.user.id,
          title: deriveTitle(lastUserMessage?.content ?? ""),
        },
        select: { id: true },
      })
      activeChatId = created.id
      createdChatId = created.id
    }

    if (lastUserMessage?.content?.trim()) {
      const saved = await prisma.message.create({
        data: {
          chatId: activeChatId,
          userId: session.user.id,
          role: "user",
          content: lastUserMessage.content,
          attachments: lastUserMessage.attachments ?? undefined,
        },
        select: { id: true },
      })
      savedUserMessageId = saved.id
    }
  }

  const result = streamText({
    model: getModel(provider, model),
    system: context.systemPrompt,
    messages: context.messages,
    tools,
    // Cross-source questions routinely need list → fetch → follow-up chains on
    // two or three sources; 10 steps cut those off mid-investigation.
    stopWhen: stepCountIs(16),
    onFinish: async ({ text }) => {
      try {
        if (activeChatId && text.trim()) {
          await prisma.message.create({
            data: { chatId: activeChatId, role: "assistant", content: text },
          })
          await prisma.chat.update({
            where: { id: activeChatId },
            data: { updatedAt: new Date() },
          })
        }
      } catch (err) {
        console.error("[chat] failed to persist assistant message:", err)
      } finally {
        await releaseTools()
      }
    },
  })

  // Hold the response until the model either starts writing or fails. A plain
  // text stream is already a 200 by the time the provider answers, so a
  // failure there (overloaded model, rate limit) used to reach the client as
  // an empty reply; caught here it becomes a real error the chat can explain.
  const parts = result.fullStream[Symbol.asyncIterator]()
  let firstText = ""

  try {
    while (!firstText) {
      const { value: part, done } = await parts.next()
      if (done) break
      if (part.type === "error") throw part.error
      if (part.type === "text-delta") firstText = part.text
    }
  } catch (err) {
    console.error("[chat] model call failed:", err)
    await Promise.all([releaseTools(), discardTurn()])
    const { status, body } = describeModelError(err)
    return Response.json(body, { status })
  }

  if (!firstText) {
    await Promise.all([releaseTools(), discardTurn()])
    return Response.json(NO_OUTPUT_ERROR, { status: 502 })
  }

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(firstText))
    },
    async pull(controller) {
      try {
        for (;;) {
          const { value: part, done } = await parts.next()
          if (done) return controller.close()
          if (part.type === "text-delta") return controller.enqueue(encoder.encode(part.text))
          if (part.type === "error") throw part.error
        }
      } catch (err) {
        // Text has already been sent, so the status can't change; say so in the answer itself.
        console.error("[chat] model stream failed mid-answer:", err)
        await releaseTools()
        controller.enqueue(encoder.encode(`\n\n${INTERRUPTED_NOTE}`))
        controller.close()
      }
    },
    async cancel() {
      await parts.return?.()
    },
  })

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...(activeChatId ? { "X-Chat-Id": activeChatId } : {}),
    },
  })
}
