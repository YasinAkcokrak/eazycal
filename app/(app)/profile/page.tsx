import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ProfileClient from "./profile-client"

export default async function ProfilePage() {
  const session = await auth()
  const userId = session!.user.id

  const [user, mealCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, createdAt: true },
    }),
    prisma.meal.count({ where: { userId } }),
  ])

  return (
    <ProfileClient
      user={{
        id: user!.id,
        name: user!.name,
        email: user!.email!,
        image: user!.image,
        createdAt: user!.createdAt.toISOString(),
      }}
      stats={{ totalScans: mealCount }}
    />
  )
}
