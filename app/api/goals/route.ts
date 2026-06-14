import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const goalSchema = z.object({
  dailyCalories: z.number().int().min(100).max(10000),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const goal = await prisma.goal.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(goal ?? { dailyCalories: 2000, proteinG: null, carbsG: null, fatG: null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = goalSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const goal = await prisma.goal.upsert({
    where: { userId: session.user.id },
    update: result.data,
    create: { userId: session.user.id, ...result.data },
  })

  return NextResponse.json(goal)
}
