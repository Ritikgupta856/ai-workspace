import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

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
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invitation token is required" },
        { status: 400 }
      )
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    })

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      )
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `This invitation has already been ${invite.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 400 }
      )
    }

    // Verify user email matches invitation email (case-insensitive)
    if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `This invitation was sent to ${invite.email}, but you are signed in as ${session.user.email}`,
        },
        { status: 403 }
      )
    }

    // Verify user is not already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "You are already a member of this workspace" },
        { status: 400 }
      )
    }

    // Create membership and update invite status in a transaction
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
          role: invite.role,
        },
      }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      }),
    ])

    // Log Activity
    logActivity({
      type: "INVITATION_ACCEPTED",
      workspaceId: invite.workspaceId,
      userId: session.user.id,
      metadata: { inviteId: invite.id },
    })

    const response = NextResponse.json({
      success: true,
      workspace: invite.workspace,
    })

    // Set the cookie activeWorkspaceId to the newly accepted workspace
    response.cookies.set("activeWorkspaceId", invite.workspaceId, {
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Accept Invite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 }
    )
  }
}
