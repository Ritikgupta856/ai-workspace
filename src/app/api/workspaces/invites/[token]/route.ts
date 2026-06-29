import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      )
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { name: true, slug: true },
        },
        invitedBy: {
          select: { name: true, email: true },
        },
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
        {
          success: false,
          error: `This invitation has already been ${invite.status.toLowerCase()}`,
          status: invite.status.toLowerCase(),
          workspaceName: invite.workspace.name,
        },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation has expired",
          status: "expired",
          workspaceName: invite.workspace.name,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        workspaceName: invite.workspace.name,
        inviterName: invite.invitedBy.name || invite.invitedBy.email,
        message: invite.message,
        expiresAt: invite.expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Validate Invite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to validate invitation" },
      { status: 500 }
    )
  }
}
