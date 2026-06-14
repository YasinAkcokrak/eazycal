"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

function toLocal(date: Date) {
  return date.toLocaleDateString("en-CA") // YYYY-MM-DD in local time
}

export default function HistoryPage() {
  const [date, setDate] = useState(toLocal(new Date()))
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const dateQuery = date === toLocal(new Date()) ? "today" : date
    fetch(`/api/meals?date=${dateQuery}`)
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
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">History</h1>

      {/* Date picker */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => shiftDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <input
            type="date"
            value={date}
            max={toLocal(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-background"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => shiftDate(1)} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {data && !loading && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Day Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Calories", value: `${data.totals.calories} kcal` },
                  { label: "Protein", value: `${data.totals.protein_g?.toFixed(1) ?? 0}g` },
                  { label: "Carbs", value: `${data.totals.carbs_g?.toFixed(1) ?? 0}g` },
                  { label: "Fat", value: `${data.totals.fat_g?.toFixed(1) ?? 0}g` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          {data.meals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No meals logged on this day.</p>
          ) : (
            <div className="space-y-2">
              {data.meals.map((meal) => (
                <Card key={meal.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {meal.calories} kcal · P {meal.protein_g?.toFixed(0)}g · C {meal.carbs_g?.toFixed(0)}g · F {meal.fat_g?.toFixed(0)}g
                      </p>
                    </div>
                    <Badge variant="outline">{meal.mealType}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
