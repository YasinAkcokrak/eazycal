import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/utils"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const LANG_LABELS: Record<string, string> = { en: "English", tr: "Turkish", es: "Spanish" }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const { mealName, calories, proteinG, fatG, carbsG, locale = "en" } = body
  const lang = LANG_LABELS[locale as string] ?? "English"

  const now = new Date()
  const [goal, userProfile, todayMeals] = await Promise.all([
    prisma.goal.findUnique({ where: { userId } }),
    prisma.userProfile.findUnique({ where: { userId }, select: { goalType: true, weightKg: true } }),
    prisma.meal.findMany({
      where: { userId, loggedAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      select: { calories: true },
    }),
  ])

  const dailyCalorieGoal = goal?.dailyCalories ?? 2000
  const consumedToday = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  const remainingCalories = dailyCalorieGoal - consumedToday
  const goalType = userProfile?.goalType ?? "MAINTAIN"

  const prompt = `You are a nutrition coach. Evaluate this meal before the user logs it.

User context:
- Daily calorie goal: ${dailyCalorieGoal} kcal
- Already consumed today: ${consumedToday} kcal
- Remaining: ${remainingCalories} kcal
- Goal: ${goalType}

Meal to evaluate:
- Name: ${mealName}
- Calories: ${calories} kcal
- Protein: ${proteinG}g | Carbs: ${carbsG}g | Fat: ${fatG}g

Respond with a JSON object (no markdown) in ${lang}:
{
  "verdict": "good" | "moderate" | "poor",
  "message": "1-2 sentence evaluation explaining the verdict in ${lang}",
  "alternative": "a specific healthier alternative dish name in ${lang}, or null if verdict is good"
}

Rules:
- "good": meal fits well within remaining calories and supports the goal
- "moderate": meal is acceptable but slightly over remaining or not ideal for goal
- "poor": meal significantly exceeds remaining calories or strongly conflicts with goal
- Keep message concise and encouraging, not harsh`

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text.trim()
    const json = JSON.parse(text)

    return NextResponse.json({
      verdict: json.verdict ?? "moderate",
      message: json.message ?? "",
      alternative: json.alternative ?? null,
    })
  } catch (err) {
    console.error("[/api/meals/evaluate] Error:", err instanceof Error ? err.message : err)
    if (err instanceof Error) console.error(err.stack)
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 })
  }
}
