import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateWorkspaceSchema } from "@/lib/validation/settings"

/** Roles allowed to change workspace details. */
const CAN_EDIT = ["OWNER", "ADMIN"] as const

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, workspaceId: id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      )
    }

    if (!CAN_EDIT.includes(membership.role as (typeof CAN_EDIT)[number])) {
      return NextResponse.json(
        {
          success: false,
          error: "Only owners and admins can update workspace settings",
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = updateWorkspaceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      )
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
      },
      select: { id: true, name: true, slug: true, description: true },
    })

    return NextResponse.json({ success: true, workspace })
  } catch (error) {
    console.error("Update Workspace Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update workspace" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, workspaceId: id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      )
    }

    if (membership.role !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Only the owner can delete a workspace" },
        { status: 403 }
      )
    }

    // Everything hanging off a workspace cascades on delete in the schema, so
    // removing the row is enough.
    await prisma.workspace.delete({ where: { id } })

    // Point the user at whatever workspace they still belong to. The dashboard
    // layout creates a fresh one if this comes back empty.
    const next = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    })

    const response = NextResponse.json({
      success: true,
      nextWorkspaceId: next?.workspaceId ?? null,
    })

    if (next) {
      response.cookies.set("activeWorkspaceId", next.workspaceId, {
        path: "/",
        sameSite: "lax",
      })
    } else {
      response.cookies.delete("activeWorkspaceId")
    }

    return response
  } catch (error) {
    console.error("Delete Workspace Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete workspace" },
      { status: 500 }
    )
  }
}
