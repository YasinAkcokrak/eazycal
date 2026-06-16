import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const metricsSchema = z.object({
  age: z.number().int().min(10).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  weightKg: z.number().min(20).max(500),
  heightCm: z.number().min(50).max(300),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
  weeklyWorkoutDays: z.number().int().min(0).max(7),
  goalType: z.enum(["LOSE_WEIGHT", "MAINTAIN", "GAIN_MUSCLE"]),
})

type MetricsInput = z.infer<typeof metricsSchema>

function computeTDEE(data: MetricsInput): number {
  const base = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age
  const bmr =
    data.gender === "MALE" ? base + 5 : data.gender === "FEMALE" ? base - 161 : base - 78

  const multiplier: Record<string, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  }
  const adjustment: Record<string, number> = {
    LOSE_WEIGHT: -500,
    MAINTAIN: 0,
    GAIN_MUSCLE: 300,
  }
  return Math.round(bmr * multiplier[data.activityLevel] + adjustment[data.goalType])
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(profile)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const result = metricsSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 })

  const dailyCalories = Math.max(1200, computeTDEE(result.data))
  const proteinG = Math.round(result.data.weightKg * 2)
  const fatG = Math.round(result.data.weightKg * 0.8)
  const carbsG = Math.max(0, Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4))

  const [profile] = await prisma.$transaction([
    prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: result.data,
      create: { userId: session.user.id, ...result.data },
    }),
    prisma.goal.upsert({
      where: { userId: session.user.id },
      update: { dailyCalories, proteinG, fatG, carbsG },
      create: { userId: session.user.id, dailyCalories, proteinG, fatG, carbsG },
    }),
  ])

  return NextResponse.json(profile)
}
