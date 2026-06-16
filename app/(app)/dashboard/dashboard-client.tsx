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

const MEAL_TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  BREAKFAST: { label: "Breakfast", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  LUNCH:     { label: "Lunch",     badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  DINNER:    { label: "Dinner",    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  SNACK:     { label: "Snack",     badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
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
        <p className="text-xs text-muted-foreground mt-1">of {goal} kcal</p>
        {over ? (
          <p className="text-xs font-semibold text-red-500 mt-1">+{consumed - goal} over</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">{goal - consumed} remaining</p>
        )}
      </div>
    </div>
  )
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number | null; color: string }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value.toFixed(1)}g{goal ? ` / ${goal}g` : ""}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardClient({ meals, totals, goal, date, userName }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deleteMeal(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/meals/${id}`, { method: "DELETE" })
    setDeleting(null)
    if (res.ok) { toast.success("Meal removed"); router.refresh() }
    else toast.error("Failed to delete meal")
  }

  const grouped = MEAL_ORDER.reduce<Record<string, Meal[]>>((acc, type) => {
    acc[type] = meals.filter((m) => m.mealType === type)
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-24 md:pb-8">

      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">{date}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
        </h1>
      </div>

      {/* Calorie ring + macros */}
      <Card>
        <CardContent className="pt-6 pb-5 space-y-6">
          <CalorieRing consumed={totals.calories} goal={goal.dailyCalories} />
          <div className="space-y-3">
            <MacroBar label="Protein" value={totals.protein} goal={goal.proteinG} color="bg-blue-500" />
            <MacroBar label="Carbs"   value={totals.carbs}   goal={goal.carbsG}   color="bg-amber-500" />
            <MacroBar label="Fat"     value={totals.fat}     goal={goal.fatG}     color="bg-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Meal List */}
      {MEAL_ORDER.map((type) => {
        const typeMeals = grouped[type]
        if (typeMeals.length === 0) return null
        const cfg = MEAL_TYPE_CONFIG[type]
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", cfg.badge)}>
                {cfg.label}
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
                        {type === "BREAKFAST" ? "🌅" : type === "LUNCH" ? "☀️" : type === "DINNER" ? "🌙" : "🍎"}
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
          <p className="font-medium mb-1">No meals logged today</p>
          <p className="text-sm mb-6">Scan your first meal to get started</p>
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
        Scan Meal
      </Link>
    </div>
  )
}
