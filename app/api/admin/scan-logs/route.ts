import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1))
  const limit = 50
  const skip = (page - 1) * limit

  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      where: { imageUrl: { not: null } },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.meal.count({ where: { imageUrl: { not: null } } }),
  ])

  return NextResponse.json({ logs: meals, total, page, pages: Math.ceil(total / limit) })
}
