import { streamText, stepCountIs, type ToolSet } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { resolveWorkspaceTools } from "@/lib/integrations/registry"
import { buildChatContext } from "@/lib/ai/context-builder"

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

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  let tools: ToolSet | undefined
  let workspaceSystemPrompt: string | undefined
  let workspaceId: string | undefined
  let workspaceName: string | undefined

  if (session?.user) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true, workspace: { select: { name: true } } },
    })

    if (membership) {
      workspaceId = membership.workspaceId
      workspaceName = membership.workspace?.name
      const result = await resolveWorkspaceTools(workspaceId, {
        userId: session.user.id,
      })
      tools = result.tools
      workspaceSystemPrompt = result.systemPrompt
    }
  }

  const context = await buildChatContext({
    workspaceSystemPrompt,
    messages,
    workspaceId,
    viewer: session?.user
      ? { name: session.user.name ?? undefined, workspace: workspaceName }
      : undefined,
  })

  if (context.type === "skip") {
    return Response.json({ message: context.message })
  }

  // Persistence runs server-side so a closed tab or a navigation mid-stream
  // still leaves a complete exchange in history.
  let activeChatId: string | undefined
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user")

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
    }

    if (lastUserMessage?.content?.trim()) {
      await prisma.message.create({
        data: {
          chatId: activeChatId,
          userId: session.user.id,
          role: "user",
          content: lastUserMessage.content,
          attachments: lastUserMessage.attachments ?? undefined,
        },
      })
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
      if (!activeChatId || !text.trim()) return
      try {
        await prisma.message.create({
          data: { chatId: activeChatId, role: "assistant", content: text },
        })
        await prisma.chat.update({
          where: { id: activeChatId },
          data: { updatedAt: new Date() },
        })
      } catch (err) {
        console.error("[chat] failed to persist assistant message:", err)
      }
    },
  })

  return result.toTextStreamResponse({
    headers: activeChatId ? { "X-Chat-Id": activeChatId } : undefined,
  })
}
