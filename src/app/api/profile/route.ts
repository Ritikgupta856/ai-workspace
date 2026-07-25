import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateProfileSchema } from "@/lib/validation/settings"

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, profile: user })
  } catch (error) {
    console.error("Get Profile Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
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
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, image: true },
    })

    return NextResponse.json({ success: true, profile: user })
  } catch (error) {
    console.error("Update Profile Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
