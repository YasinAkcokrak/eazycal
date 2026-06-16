import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, formatDate } from "@/lib/utils"
import { redirect } from "next/navigation"
import type { Meal, ActivityLevel, GoalType, Gender } from "@prisma/client"
import DashboardClient from "./dashboard-client"

function computeTDEE(
  age: number,
  gender: Gender,
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  goalType: GoalType,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const bmr = gender === "MALE" ? base + 5 : gender === "FEMALE" ? base - 161 : base - 78
  const multiplier: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9,
  }
  const adjustment: Record<GoalType, number> = {
    LOSE_WEIGHT: -500, MAINTAIN: 0, GAIN_MUSCLE: 300,
  }
  return Math.round(bmr * multiplier[activityLevel] + adjustment[goalType])
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const today = new Date()
  const [meals, goal, userProfile] = await Promise.all([
    prisma.meal.findMany({
      where: {
        userId,
        loggedAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.goal.findUnique({ where: { userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ])

  if (!userProfile) redirect("/onboarding")

  // Derive goal from UserProfile if the Goal row is missing (edge case for pre-existing users)
  const resolvedGoal = goal ?? (() => {
    const dailyCalories = Math.max(
      1200,
      computeTDEE(
        userProfile.age,
        userProfile.gender,
        userProfile.weightKg,
        userProfile.heightCm,
        userProfile.activityLevel,
        userProfile.goalType,
      ),
    )
    const proteinG = Math.round(userProfile.weightKg * 2)
    const fatG = Math.round(userProfile.weightKg * 0.8)
    const carbsG = Math.max(0, Math.round((dailyCalories - proteinG * 4 - fatG * 9) / 4))
    return { dailyCalories, proteinG, fatG, carbsG }
  })()

  const totals = meals.reduce<{ calories: number; protein: number; carbs: number; fat: number }>(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.proteinG,
      carbs: acc.carbs + m.carbsG,
      fat: acc.fat + m.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return (
    <DashboardClient
      userName={session!.user.name ?? null}
      meals={meals.map((m: Meal) => ({
        id: m.id,
        name: m.name,
        mealType: m.mealType,
        calories: m.calories,
        proteinG: m.proteinG,
        carbsG: m.carbsG,
        fatG: m.fatG,
        imageUrl: m.imageUrl,
        loggedAt: m.loggedAt.toISOString(),
      }))}
      totals={totals}
      goal={resolvedGoal}
      date={formatDate(today)}
    />
  )
}
