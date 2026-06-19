import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import GoalsClient from "./goals-client"

export default async function GoalsPage() {
  const session = await auth()
  const userId = session!.user.id

  const [goal, userProfile] = await Promise.all([
    prisma.goal.findUnique({ where: { userId } }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ])

  return (
    <GoalsClient
      goal={{
        dailyCalories: goal?.dailyCalories ?? 2000,
        proteinG: goal?.proteinG ?? null,
        carbsG: goal?.carbsG ?? null,
        fatG: goal?.fatG ?? null,
      }}
      userProfile={userProfile ? {
        age: userProfile.age,
        gender: userProfile.gender,
        weightKg: userProfile.weightKg,
        heightCm: userProfile.heightCm,
        activityLevel: userProfile.activityLevel,
        weeklyWorkoutDays: userProfile.weeklyWorkoutDays,
        goalType: userProfile.goalType,
      } : null}
    />
  )
}
