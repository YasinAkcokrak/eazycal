"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Camera, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

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
  userName: string | null
}

const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]

const MEAL_EMOJI: Record<string, string> = {
  BREAKFAST: "🌅", LUNCH: "☀️", DINNER: "🌙", SNACK: "🍎",
}

const MEAL_BADGE: Record<string, string> = {
  BREAKFAST: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LUNCH:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  DINNER:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  SNACK:     "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
}

function CalorieRing({ consumed, goal, label }: { consumed: number; goal: number; label: string }) {
  const size = 192
  const sw = 18
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const progress = Math.min(1, consumed / goal)
  const offset = circ * (1 - progress)
  const over = consumed > goal

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} stroke="currentColor" className="text-muted/20" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw}
          stroke={over ? "#ef4444" : "#E24B4A"}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute text-center select-none">
        <p className="text-4xl font-bold leading-none">{consumed}</p>
        <p className="text-xs text-muted-foreground mt-1">/ {goal} kcal</p>
        <p className={cn("text-xs font-semibold mt-1", over ? "text-red-500" : "text-muted-foreground")}>
          {label}
        </p>
      </div>
    </div>
  )
}

export default function DashboardClient({ meals, totals, goal, date, userName }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const t = useTranslations()

  const caloriesOver = totals.calories - goal.dailyCalories
  const ringLabel = caloriesOver > 0
    ? t("dashboard.overBy", { amount: caloriesOver })
    : `${goal.dailyCalories - totals.calories} ${t("dashboard.remaining")}`

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return t("greeting.morning")
    if (h < 17) return t("greeting.afternoon")
    return t("greeting.evening")
  }

  async function deleteMeal(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" })
    setDeleting(null)
    if (res.ok) { toast.success(t("dashboard.mealRemoved")); router.refresh() }
    else toast.error(t("dashboard.deleteFailed"))
  }

  const grouped = MEAL_ORDER.reduce<Record<string, Meal[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.mealType === type)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <p className="text-muted-foreground text-sm">{date}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
        </h1>
      </div>

      {/* Calorie ring + macros */}
      <Card>
        <CardContent className="pt-6 pb-5 space-y-6">
          <CalorieRing consumed={totals.calories} goal={goal.dailyCalories} label={ringLabel} />
          <div className="space-y-3">
            {[
              { key: "protein" as const, value: totals.protein, goal: goal.proteinG, color: "bg-blue-500" },
              { key: "carbs"   as const, value: totals.carbs,   goal: goal.carbsG,   color: "bg-amber-500" },
              { key: "fat"     as const, value: totals.fat,     goal: goal.fatG,     color: "bg-green-500" },
            ].map(({ key, value, goal: g, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t(`dashboard.${key}`)}</span>
                  <span className="text-muted-foreground">{value.toFixed(1)}g{g ? ` / ${g}g` : ""}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", color)}
                    style={{ width: g ? `${Math.min(100, (value / g) * 100)}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal List */}
      {MEAL_ORDER.map((type) => {
        const typeMeals = grouped[type]
        if (typeMeals.length === 0) return null
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", MEAL_BADGE[type])}>
                {t(`mealTypes.${type}`)}
              </span>
            </div>
            <Card>
              <CardContent className="p-0 divide-y">
                {typeMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 p-4">
                    {meal.imageUrl && meal.imageUrl.includes("blob.vercel-storage.com") ? (
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                        <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted shrink-0 flex items-center justify-center text-2xl">
                        {MEAL_EMOJI[type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{meal.name}</p>
                      <p className="text-base font-bold text-[#E24B4A] mt-0.5">{meal.calories} kcal</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        P {meal.proteinG.toFixed(0)}g · C {meal.carbsG.toFixed(0)}g · F {meal.fatG.toFixed(0)}g
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deleting === meal.id}
                      onClick={() => deleteMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )
      })}

      {meals.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium mb-1">{t("dashboard.noMeals")}</p>
          <p className="text-sm mb-6">{t("dashboard.scanFirst")}</p>
        </div>
      )}

      {/* Floating scan button */}
      <Link
        href="/scan"
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-20",
          "flex items-center gap-2 px-5 py-3 rounded-full shadow-lg font-semibold text-sm",
          "bg-[#E24B4A] text-white hover:bg-[#c93d3c] transition-colors",
        )}
      >
        <Camera className="h-4 w-4" />
        {t("dashboard.scanMeal")}
      </Link>
    </div>
  )
}
