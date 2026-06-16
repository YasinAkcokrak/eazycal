"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Meal {
  id: string
  name: string
  mealType: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  imageUrl: string | null
  loggedAt: string
}

interface DayData {
  date: string
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
  meals: Meal[]
}

const MEAL_TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  BREAKFAST: { label: "Breakfast", badge: "bg-blue-100 text-blue-700" },
  LUNCH:     { label: "Lunch",     badge: "bg-emerald-100 text-emerald-700" },
  DINNER:    { label: "Dinner",    badge: "bg-purple-100 text-purple-700" },
  SNACK:     { label: "Snack",     badge: "bg-orange-100 text-orange-700" },
}

function toLocal(date: Date) {
  return date.toLocaleDateString("en-CA")
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  const today = toLocal(new Date())
  const yesterday = toLocal(new Date(Date.now() - 86400000))
  if (dateStr === today) return "Today"
  if (dateStr === yesterday) return "Yesterday"
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

export default function HistoryPage() {
  const [date, setDate] = useState(toLocal(new Date()))
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const q = date === toLocal(new Date()) ? "today" : date
    fetch(`/api/meals?date=${q}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [date])

  function shiftDate(days: number) {
    const d = new Date(date + "T00:00:00")
    d.setDate(d.getDate() + days)
    setDate(toLocal(d))
  }

  const isToday = date === toLocal(new Date())

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review your past meals</p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="shrink-0" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-semibold">{formatDisplayDate(date)}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <Button variant="outline" size="icon" className="shrink-0" onClick={() => shiftDate(1)} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Calories", value: data.totals.calories, unit: "kcal", color: "text-[#E24B4A]", bg: "bg-red-50 dark:bg-red-950/20" },
              { label: "Protein",  value: +(data.totals.protein_g ?? 0).toFixed(1), unit: "g", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
              { label: "Carbs",    value: +(data.totals.carbs_g ?? 0).toFixed(1),   unit: "g", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
              { label: "Fat",      value: +(data.totals.fat_g ?? 0).toFixed(1),     unit: "g", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
            ].map(({ label, value, unit, color, bg }) => (
              <Card key={label} className={cn("border-0", bg)}>
                <CardContent className="p-4 text-center">
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{unit} {label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Meal list */}
          {data.meals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">No meals logged on this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.meals.map((meal) => {
                const cfg = MEAL_TYPE_CONFIG[meal.mealType] ?? MEAL_TYPE_CONFIG.SNACK
                return (
                  <Card key={meal.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {meal.imageUrl && meal.imageUrl.includes("blob.vercel-storage.com") ? (
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                          <Image src={meal.imageUrl} alt={meal.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-xl">
                          {meal.mealType === "BREAKFAST" ? "🌅" : meal.mealType === "LUNCH" ? "☀️" : meal.mealType === "DINNER" ? "🌙" : "🍎"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{meal.name}</p>
                        <p className="text-sm font-bold text-[#E24B4A]">{meal.calories} kcal</p>
                        <p className="text-xs text-muted-foreground">
                          P {meal.protein_g?.toFixed(0)}g · C {meal.carbs_g?.toFixed(0)}g · F {meal.fat_g?.toFixed(0)}g
                        </p>
                      </div>
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0", cfg.badge)}>
                        {cfg.label}
                      </span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
