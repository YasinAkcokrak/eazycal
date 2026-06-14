import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, formatDate } from "@/lib/utils"
import type { Meal } from "@prisma/client"
import DashboardClient from "./dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const today = new Date()
  const [meals, goal] = await Promise.all([
    prisma.meal.findMany({
      where: {
        userId,
        loggedAt: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.goal.findUnique({ where: { userId } }),
  ])

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
      goal={goal ?? { dailyCalories: 2000, proteinG: null, carbsG: null, fatG: null }}
      date={formatDate(today)}
    />
  )
}
