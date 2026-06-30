import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createWorkspaceSchema } from "@/lib/validation/workspace"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = slugify(name) || "workspace"
  let slug = baseSlug
  for (let i = 0; i < 20; i++) {
    const existing = await prisma.workspace.findUnique({ where: { slug } })
    if (!existing) return slug
    const suffix = Math.random().toString(36).substring(2, 6)
    slug = `${baseSlug}-${suffix}`
  }
  return `${baseSlug}-${Date.now().toString(36)}`
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: true,
      },
    })

    const formatted = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      joinedAt: m.createdAt,
    }))

    return NextResponse.json({
      success: true,
      workspaces: formatted,
    })
  } catch (error) {
    console.error("List Workspaces Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to list workspaces" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    // If workspaceId is provided, switch workspace
    if (body.workspaceId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: session.user.id,
          workspaceId: body.workspaceId,
        },
      })

      if (!membership) {
        return NextResponse.json(
          { success: false, error: "You are not a member of this workspace" },
          { status: 403 }
        )
      }

      const response = NextResponse.json({ success: true })
      response.cookies.set("activeWorkspaceId", body.workspaceId, {
        path: "/",
        sameSite: "lax",
      })

      return response
    }

    // Otherwise, create a new workspace
    const parsed = createWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      )
    }

    const { name, description, logo } = parsed.data
    const slug = await generateUniqueSlug(name)

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description: description || null,
        logo: logo || null,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    })

    const response = NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    })

    response.cookies.set("activeWorkspaceId", workspace.id, {
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Workspace Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    )
  }
}
