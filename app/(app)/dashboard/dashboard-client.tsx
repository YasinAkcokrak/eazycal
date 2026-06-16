"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Camera, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface Meal {
  id: string
  name: string
  mealType: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  imageUrl: string | null
  loggedAt: string
}

interface Goal {
  dailyCalories: number
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
}

interface Props {
  meals: Meal[]
  totals: { calories: number; protein: number; carbs: number; fat: number }
  goal: Goal
  date: string
}

const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]

export default function DashboardClient({ meals, totals, goal, date }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const caloriePercent = Math.min(100, (totals.calories / goal.dailyCalories) * 100)

  async function deleteMeal(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" })
    setDeleting(null)
    if (res.ok) {
      toast.success("Meal removed")
      router.refresh()
    } else {
      toast.error("Failed to delete meal")
    }
  }

  const grouped = MEAL_ORDER.reduce<Record<string, Meal[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.mealType === type)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{date}</p>
        </div>
        <Link href="/scan" className={cn(buttonVariants())}>
          <Camera className="h-4 w-4 mr-2" />
          Scan Meal
        </Link>
      </div>

      {/* Calorie Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Calories Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{totals.calories}</span>
            <span className="text-muted-foreground mb-1">/ {goal.dailyCalories} kcal</span>
          </div>
          <Progress value={caloriePercent} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {Math.max(0, goal.dailyCalories - totals.calories)} kcal remaining
          </p>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card>
        <CardHeader>
          <CardTitle>Macros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Protein", value: totals.protein, goal: goal.proteinG, color: "bg-blue-500" },
            { label: "Carbs", value: totals.carbs, goal: goal.carbsG, color: "bg-yellow-500" },
            { label: "Fat", value: totals.fat, goal: goal.fatG, color: "bg-red-500" },
          ].map(({ label, value, goal: g, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted-foreground">
                  {value.toFixed(1)}g{g ? ` / ${g}g` : ""}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all`}
                  style={{ width: g ? `${Math.min(100, (value / g) * 100)}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Meal List */}
      {MEAL_ORDER.map((type) => {
        const typeMeals = grouped[type]
        if (typeMeals.length === 0) return null
        return (
          <div key={type}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </h2>
            <div className="space-y-2">
              {typeMeals.map((meal) => (
                <Card key={meal.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    {meal.imageUrl && meal.imageUrl.includes("blob.vercel-storage.com") && (
                      <div className="relative h-14 w-14 rounded-md overflow-hidden shrink-0">
                        <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{meal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {meal.calories} kcal · P {meal.proteinG.toFixed(0)}g · C {meal.carbsG.toFixed(0)}g · F {meal.fatG.toFixed(0)}g
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deleting === meal.id}
                      onClick={() => deleteMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {meals.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No meals logged today.</p>
          <Link href="/scan" className={cn(buttonVariants())}>
            <Camera className="h-4 w-4 mr-2" />
            Scan your first meal
          </Link>
        </div>
      )}
    </div>
  )
}
