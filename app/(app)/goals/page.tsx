"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  dailyCalories: z.coerce.number().int().min(100).max(10000),
  proteinG: z.coerce.number().min(0).optional(),
  carbsG: z.coerce.number().min(0).optional(),
  fatG: z.coerce.number().min(0).optional(),
})
type FormValues = z.infer<typeof schema>

export default function GoalsPage() {
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { dailyCalories: 2000, proteinG: undefined, carbsG: undefined, fatG: undefined },
  })

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((g) => {
        form.reset({
          dailyCalories: g.dailyCalories ?? 2000,
          proteinG: g.proteinG ?? undefined,
          carbsG: g.carbsG ?? undefined,
          fatG: g.fatG ?? undefined,
        })
        setLoaded(true)
      })
  }, [form])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    setSaving(false)

    if (res.ok) {
      toast.success("Goals saved!")
    } else {
      toast.error("Failed to save goals")
    }
  }

  if (!loaded) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Daily Goals</h1>

      <Card>
        <CardHeader>
          <CardTitle>Set Your Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="dailyCalories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Calorie Goal (kcal) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={100} max={10000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm text-muted-foreground font-medium">Macro Targets (optional)</p>

              <div className="grid grid-cols-3 gap-4">
                {(["proteinG", "carbsG", "fatG"] as const).map((key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {key === "proteinG" ? "Protein" : key === "carbsG" ? "Carbs" : "Fat"} (g)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            placeholder="—"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Goals"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
