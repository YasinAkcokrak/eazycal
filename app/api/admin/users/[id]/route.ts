import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      meals: { orderBy: { loggedAt: "desc" }, take: 50 },
      goal: true,
      _count: { select: { meals: true } },
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { isActive } = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
    select: { id: true, isActive: true },
  })

  return NextResponse.json(user)
}
