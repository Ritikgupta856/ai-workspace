import { generateText, stepCountIs, type ModelMessage } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { resolveWorkspaceTools } from "@/lib/integrations/registry"

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
  let systemPrompt: string | undefined

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
      systemPrompt = result.systemPrompt
    }
  }

  const modelMessages: ModelMessage[] = messages.map(
    (m: { role: "user" | "assistant"; content: string }) => ({
      role: m.role,
      content: m.content,
    })
  )

  const { text } = await generateText({
    model: getModel(provider, model),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10),
  })

  return Response.json({ message: text })
}
