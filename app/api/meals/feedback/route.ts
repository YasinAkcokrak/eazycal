import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const LANG_LABELS: Record<string, string> = { en: "English", tr: "Turkish", es: "Spanish" }

const schema = z.object({
  mealName: z.string().max(200),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  fatG: z.number().min(0),
  carbsG: z.number().min(0),
  locale: z.enum(["en", "tr", "es"]).default("en"),
})

function nullify(v: unknown): string | null {
  if (v === null || v === "null" || v === undefined || v === "") return null
  return typeof v === "string" ? v : null
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const { mealName, calories, proteinG, fatG, carbsG, locale } = parsed.data
  const userId = session.user.id

  const [goal, userProfile] = await Promise.all([
    prisma.goal.findUnique({ where: { userId } }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { goalType: true, weightKg: true },
    }),
  ])

  if (!goal || !userProfile) {
    return NextResponse.json({ warning: null, suggestion: null, alternativeMeal: null })
  }

  const pct = Math.round((calories / goal.dailyCalories) * 100)
  const heavyMeal = pct > 40
  const highFat = userProfile.goalType === "LOSE_WEIGHT" && fatG > 30
  const lowProtein = userProfile.goalType === "GAIN_MUSCLE" && proteinG < 20
  const anyIssue = heavyMeal || highFat || lowProtein
  const lang = LANG_LABELS[locale] ?? "English"

  const issueLines = [
    heavyMeal && `• Heavy meal: ${pct}% of daily ${goal.dailyCalories} kcal target`,
    highFat   && `• High fat (${fatG}g, recommended ≤30g for weight loss)`,
    lowProtein && `• Low protein (${proteinG}g, recommend ≥20g per meal for muscle gain)`,
  ].filter(Boolean).join("\n")

  const prompt = `You are a brief, encouraging nutrition coach. A user just logged a meal.

User profile:
- Goal: ${userProfile.goalType}
- Daily calorie target: ${goal.dailyCalories} kcal
- Weight: ${userProfile.weightKg} kg

Meal logged: "${mealName}"
- Calories: ${calories} kcal (${pct}% of daily goal)
- Protein: ${proteinG}g | Fat: ${fatG}g | Carbs: ${carbsG}g

${anyIssue ? `Issues detected:\n${issueLines}` : "No issues — meal fits the user's goal well."}

Return ONLY valid JSON in ${lang} language (no markdown fences, no extra text):
{
  "warning": ${anyIssue ? '"one concise warning sentence addressing the issue(s)"' : "null"},
  "suggestion": "one short actionable tip aligned with their goal",
  "alternativeMeal": ${highFat || lowProtein ? '"name of a specific healthier alternative meal"' : "null"}
}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    })

    const block = response.content[0]
    const raw = (block.type === "text" ? block.text : "")
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")

    const fb = JSON.parse(raw)
    return NextResponse.json({
      warning: nullify(fb.warning),
      suggestion: nullify(fb.suggestion),
      alternativeMeal: nullify(fb.alternativeMeal),
    })
  } catch {
    return NextResponse.json({ warning: null, suggestion: null, alternativeMeal: null })
  }
}
