import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ProfileClient from "./profile-client"

export default async function ProfilePage() {
  const session = await auth()
  const userId = session!.user.id

  const [user, allMeals, topTypeResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, createdAt: true, password: true },
    }),
    prisma.meal.findMany({
      where: { userId },
      select: { loggedAt: true, calories: true },
    }),
    prisma.meal.groupBy({
      by: ["mealType"],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
  ])

  const daysTracked = new Set(allMeals.map((m) => m.loggedAt.toISOString().slice(0, 10))).size
  const totalCalories = allMeals.reduce((sum, m) => sum + m.calories, 0)

  return (
    <ProfileClient
      user={{
        id: user!.id,
        name: user!.name,
        email: user!.email!,
        image: user!.image,
        createdAt: user!.createdAt.toISOString(),
        hasPassword: !!user!.password,
      }}
      stats={{
        totalMeals: allMeals.length,
        daysTracked,
        totalCalories,
        topMealType: topTypeResult[0]?.mealType ?? null,
      }}
    />
  )
}
