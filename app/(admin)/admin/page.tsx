import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Camera, Activity, TrendingUp } from "lucide-react"

export default async function AdminPage() {
  await auth()

  const today = new Date()

  const [totalUsers, totalScansToday, totalScans, activeToday] = await Promise.all([
    prisma.user.count(),
    prisma.meal.count({ where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } } }),
    prisma.meal.count(),
    prisma.meal
      .groupBy({ by: ["userId"], where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } } })
      .then((r: unknown[]) => r.length),
  ])

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Active Users Today", value: activeToday, icon: Activity },
    { label: "Scans Today", value: totalScansToday, icon: Camera },
    { label: "All-Time Scans", value: totalScans, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
