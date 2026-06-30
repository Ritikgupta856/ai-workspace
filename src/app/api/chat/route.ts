import { streamText, stepCountIs } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { resolveWorkspaceTools } from "@/lib/integrations/registry"
import { buildChatContext } from "@/lib/ai/context-builder"

export async function POST(req: Request) {
  const { provider, model, messages } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return Response.json(
      { error: "Missing or invalid 'messages' in request body" },
      { status: 400 }
    )
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  let tools: Record<string, any> | undefined
  let workspaceSystemPrompt: string | undefined

  if (session?.user) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    })

    if (membership) {
      const result = await resolveWorkspaceTools(membership.workspaceId, {
        userId: session.user.id,
      })
      tools = result.tools
      workspaceSystemPrompt = result.systemPrompt
    }
  }

  const context = await buildChatContext({
    workspaceSystemPrompt,
    messages,
  })

  if (context.type === "skip") {
    return Response.json({ message: context.message })
  }

  const result = streamText({
    model: getModel(provider, model),
    system: context.systemPrompt,
    messages: context.messages,
    tools,
    stopWhen: stepCountIs(10),
  })

  return result.toTextStreamResponse()
}
