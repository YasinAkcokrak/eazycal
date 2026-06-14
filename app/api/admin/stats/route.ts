import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/utils"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const today = new Date()

  const [totalUsers, activeUsersToday, totalScansToday, totalScans] = await Promise.all([
    prisma.user.count(),
    prisma.meal.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } },
    }).then((r: unknown[]) => r.length),
    prisma.meal.count({ where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } } }),
    prisma.meal.count(),
  ])

  return NextResponse.json({
    total_users: totalUsers,
    active_users_today: activeUsersToday,
    total_scans_today: totalScansToday,
    total_scans_all_time: totalScans,
  })
}
