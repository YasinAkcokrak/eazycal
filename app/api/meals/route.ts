import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/utils"
import { z } from "zod"
import type { Meal } from "@prisma/client"
import { MealType, Confidence } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1),
  mealType: z.nativeEnum(MealType),
  calories: z.number().int().min(0),
  protein_g: z.number().min(0).default(0),
  carbs_g: z.number().min(0).default(0),
  fat_g: z.number().min(0).default(0),
  image_url: z.string().optional(),
  confidence: z.nativeEnum(Confidence).optional(),
  ai_notes: z.string().optional(),
  logged_at: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dateParam = req.nextUrl.searchParams.get("date")
  const date = !dateParam || dateParam === "today" ? new Date() : new Date(dateParam + "T00:00:00")

  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      loggedAt: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: { loggedAt: "asc" },
  })

  const totals = meals.reduce<{ calories: number; protein_g: number; carbs_g: number; fat_g: number }>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.proteinG,
      carbs_g: acc.carbs_g + m.carbsG,
      fat_g: acc.fat_g + m.fatG,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )

  return NextResponse.json({
    date: dateParam,
    totals,
    meals: meals.map((m: Meal) => ({
      id: m.id,
      name: m.name,
      mealType: m.mealType,
      calories: m.calories,
      protein_g: m.proteinG,
      carbs_g: m.carbsG,
      fat_g: m.fatG,
      imageUrl: m.imageUrl,
      confidence: m.confidence,
      aiNotes: m.aiNotes,
      loggedAt: m.loggedAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  console.log("[POST /api/meals] body:", JSON.stringify(body, null, 2))
  const result = createSchema.safeParse(body)
  if (!result.success) {
    console.log("[POST /api/meals] validation errors:", JSON.stringify(result.error.flatten(), null, 2))
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { name, mealType, calories, protein_g, carbs_g, fat_g, image_url, confidence, ai_notes, logged_at } =
    result.data

  const meal = await prisma.meal.create({
    data: {
      userId: session.user.id,
      name,
      mealType,
      calories,
      proteinG: protein_g,
      carbsG: carbs_g,
      fatG: fat_g,
      imageUrl: image_url,
      confidence,
      aiNotes: ai_notes,
      loggedAt: logged_at ? new Date(logged_at) : new Date(),
    },
  })

  return NextResponse.json(meal, { status: 201 })
}
