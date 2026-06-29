import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Role } from "@/generated/prisma/client"
import { sendInviteEmail } from "@/lib/mail"
import { logActivity } from "@/lib/activity"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const),
  message: z.string().max(500, "Message must be at most 500 characters").optional(),
})

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

    // Determine current user's workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      include: { workspace: true },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    // Verify user is an OWNER or ADMIN
    if (membership.role !== Role.OWNER && membership.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can invite members" },
        { status: 403 }
      )
    }

    // Parse and validate body
    const body = await req.json()
    const result = inviteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, role, message } = result.data

    // Security check: Only Owners can invite another Owner
    if (role === "OWNER" && membership.role !== Role.OWNER) {
      return NextResponse.json(
        { success: false, error: "Only workspace owners can invite other owners" },
        { status: 403 }
      )
    }

    // Check if invited email already belongs to the workspace
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: membership.workspaceId,
        user: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this workspace" },
        { status: 400 }
      )
    }

    // Check for an existing pending invitation
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: membership.workspaceId,
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    })

    if (existingInvite) {
      if (existingInvite.status === "PENDING" && existingInvite.expiresAt > new Date()) {
        return NextResponse.json(
          { success: false, error: "A pending invitation already exists for this email" },
          { status: 400 }
        )
      }

      // If invite exists but is not pending (or expired), delete it first to avoid unique key conflicts
      await prisma.workspaceInvite.delete({
        where: { id: existingInvite.id },
      })
    }

    // Generate token and calculate expiration (7 days from now)
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: membership.workspaceId,
        email: email.toLowerCase(),
        role: role as Role,
        message,
        token,
        invitedById: session.user.id,
        expiresAt,
        status: "PENDING",
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Log Activity
    logActivity({
      type: "INVITATION_SENT",
      workspaceId: membership.workspaceId,
      userId: session.user.id,
      metadata: { inviteId: invite.id, email: invite.email, role: invite.role },
    })

    // Send Email
    try {
      await sendInviteEmail({
        email: invite.email,
        workspaceName: membership.workspace.name,
        inviterName: session.user.name || session.user.email,
        role: invite.role,
        token: invite.token,
        message: invite.message,
      })
    } catch (mailError: any) {
      // If email delivery fails, the invitation remains in the database and the API returns a error.
      return NextResponse.json(
        {
          success: false,
          error: `Invitation created, but email delivery failed: ${mailError.message}`,
          invite,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invite,
    })
  } catch (error) {
    console.error("Create Invite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create invitation" },
      { status: 500 }
    )
  }
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

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      )
    }

    // Fetch pending invitations (status = PENDING)
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId: membership.workspaceId,
        status: "PENDING",
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      invites,
    })
  } catch (error) {
    console.error("Fetch Invites Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch invitations" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
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
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invitation ID is required" },
        { status: 400 }
      )
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { id },
    })

    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      )
    }

    // Verify caller has permissions in that workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can cancel invitations" },
        { status: 403 }
      )
    }

    const updatedInvite = await prisma.workspaceInvite.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    // Log Activity
    logActivity({
      type: "INVITATION_CANCELLED",
      workspaceId: invite.workspaceId,
      userId: session.user.id,
      metadata: { inviteId: invite.id, email: invite.email },
    })

    return NextResponse.json({ success: true, invite: updatedInvite })
  } catch (error) {
    console.error("Cancel Invite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to cancel invitation" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
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
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invitation ID is required" },
        { status: 400 }
      )
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { id },
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

    // Verify caller has permissions in that workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: invite.workspaceId,
      },
    })

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.ADMIN)) {
      return NextResponse.json(
        { success: false, error: "Only owners and admins can resend invitations" },
        { status: 403 }
      )
    }

    // Regenerate expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const updatedInvite = await prisma.workspaceInvite.update({
      where: { id },
      data: {
        expiresAt,
        status: "PENDING",
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Log Activity
    logActivity({
      type: "INVITATION_RESENT",
      workspaceId: invite.workspaceId,
      userId: session.user.id,
      metadata: { inviteId: invite.id, email: invite.email },
    })

    // Send Email
    try {
      await sendInviteEmail({
        email: updatedInvite.email,
        workspaceName: invite.workspace.name,
        inviterName: session.user.name || session.user.email,
        role: updatedInvite.role,
        token: updatedInvite.token,
        message: updatedInvite.message,
      })
    } catch (mailError: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Invitation updated, but email delivery failed: ${mailError.message}`,
          invite: updatedInvite,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, invite: updatedInvite })
  } catch (error) {
    console.error("Resend Invite Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to resend invitation" },
      { status: 500 }
    )
  }
}
