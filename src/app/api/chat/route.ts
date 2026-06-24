import { generateText, stepCountIs, type ModelMessage } from "ai"
import { getModel } from "@/lib/ai"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createGitHubClient } from "@/lib/github"
import { createGitHubTools } from "@/lib/github-tools"

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

  let tools: ReturnType<typeof createGitHubTools> | undefined

  if (session?.user) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (membership) {
      const integration = await prisma.integration.findFirst({
        where: {
          workspaceId: membership.workspaceId,
          type: "GITHUB",
          status: "CONNECTED",
        },
      })

      if (integration?.accessToken) {
        const octokit = createGitHubClient(integration.accessToken)
        tools = createGitHubTools(octokit)
      }
    }
  }

  const modelMessages: ModelMessage[] = messages.map(
    (m: { role: "user" | "assistant"; content: string }) => ({
      role: m.role,
      content: m.content,
    })
  )

  const system = tools
    ? "You have access to the user's GitHub repositories through the available tools. " +
      "Use them when the user asks about their repos, issues, pull requests, or code. " +
      "You can list repositories, search code, view issues and PRs, read file contents, and more."
    : undefined

  const { text } = await generateText({
    model: getModel(provider, model),
    system,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10),
  })

  return Response.json({ message: text })
}
