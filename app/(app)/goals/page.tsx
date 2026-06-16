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
import { Loader2, Target, Beef, Wheat, Droplets } from "lucide-react"
import { useTranslations } from "next-intl"

const schema = z.object({
  dailyCalories: z.coerce.number().int().min(100).max(10000),
  proteinG: z.coerce.number().min(0).optional(),
  carbsG: z.coerce.number().min(0).optional(),
  fatG: z.coerce.number().min(0).optional(),
})
type FormValues = z.infer<typeof schema>

export default function GoalsPage() {
  const t = useTranslations()
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
        form.reset({ dailyCalories: g.dailyCalories ?? 2000, proteinG: g.proteinG ?? undefined, carbsG: g.carbsG ?? undefined, fatG: g.fatG ?? undefined })
        setLoaded(true)
      })
  }, [form])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) })
    setSaving(false)
    if (res.ok) toast.success(t("goals.saved"))
    else toast.error(t("goals.saveFailed"))
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />{t("common.loading")}
      </div>
    )
  }

  const macroFields = [
    { key: "proteinG" as const, label: t("dashboard.protein"), icon: Beef,     color: "text-blue-500",  bg: "bg-blue-50 dark:bg-blue-950/30" },
    { key: "carbsG"   as const, label: t("dashboard.carbs"),   icon: Wheat,    color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { key: "fatG"     as const, label: t("dashboard.fat"),     icon: Droplets, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  ]

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">{t("goals.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("goals.subtitle")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-[#E24B4A]" />
                {t("goals.calorieGoal")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="dailyCalories" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("goals.dailyCalories")}</FormLabel>
                  <FormControl><Input type="number" min={100} max={10000} className="text-lg font-semibold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("goals.macroTargets")} <span className="font-normal text-muted-foreground">{t("goals.optional")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {macroFields.map(({ key, label, icon: Icon, color, bg }) => (
                <FormField key={key} control={form.control} name={key} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${bg}`}>
                        <Icon className={`h-3 w-3 ${color}`} />
                      </span>
                      {label} (g)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.1} placeholder={t("goals.notSet")}
                        {...field} value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-base font-semibold bg-[#E24B4A] hover:bg-[#c93d3c] text-white" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("goals.saving")}</> : t("goals.save")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
