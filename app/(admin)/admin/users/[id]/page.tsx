import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Meal } from "@prisma/client"
import Link from "next/link"

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      meals: { orderBy: { loggedAt: "desc" }, take: 50 },
      goal: true,
      _count: { select: { meals: true } },
    },
  })

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">User Profile</h1>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xl">{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{user.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex gap-2">
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Meals", value: user._count.meals },
          { label: "Daily Goal", value: user.goal ? `${user.goal.dailyCalories} kcal` : "Not set" },
          { label: "Joined", value: new Date(user.createdAt).toLocaleDateString() },
          { label: "Provider", value: user.password ? "Email" : "Google" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {user.meals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meals logged.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.meals.map((m: Meal) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.mealType}</Badge>
                      </TableCell>
                      <TableCell>{m.calories} kcal</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(m.loggedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
