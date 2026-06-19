"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Target, Beef, Wheat, Droplets, Flame, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"
import MetricsSection, { type UserProfileData } from "./metrics-section"

interface GoalData {
  dailyCalories: number
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
}

interface Props {
  goal: GoalData
  userProfile: UserProfileData | null
}

const manualSchema = z.object({
  dailyCalories: z.coerce.number().int().min(100).max(10000),
  proteinG: z.coerce.number().min(0).optional(),
  carbsG: z.coerce.number().min(0).optional(),
  fatG: z.coerce.number().min(0).optional(),
})
type ManualValues = z.infer<typeof manualSchema>

export default function GoalsClient({ goal, userProfile }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<ManualValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(manualSchema) as any,
    defaultValues: {
      dailyCalories: goal.dailyCalories,
      proteinG: goal.proteinG ?? undefined,
      carbsG: goal.carbsG ?? undefined,
      fatG: goal.fatG ?? undefined,
    },
  })

  async function onSubmit(values: ManualValues) {
    setSaving(true)
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(t("goals.saved"))
      router.refresh()
    } else {
      toast.error(t("goals.saveFailed"))
    }
  }

  const macroFields = [
    { key: "proteinG" as const, label: t("dashboard.protein"), icon: Beef,     color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/30" },
    { key: "carbsG"   as const, label: t("dashboard.carbs"),   icon: Wheat,    color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { key: "fatG"     as const, label: t("dashboard.fat"),     icon: Droplets, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  ]

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">{t("goals.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("goals.subtitle")}</p>
      </div>

      {/* Hero — current active goal */}
      <Card className="bg-gradient-to-br from-[#E24B4A] to-[#c93d3c] text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 uppercase tracking-wider">{t("goals.calorieGoal")}</p>
              <p className="text-4xl font-bold leading-none">
                {goal.dailyCalories.toLocaleString()}
                <span className="text-base font-normal text-white/70 ml-2">kcal / {t("common.of").toLowerCase() === "of" ? "day" : t("common.of")}</span>
              </p>
            </div>
          </div>
          {(goal.proteinG || goal.carbsG || goal.fatG) && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
              {goal.proteinG != null && (
                <div className="text-center">
                  <p className="text-lg font-bold">{goal.proteinG}g</p>
                  <p className="text-xs text-white/70">{t("dashboard.protein")}</p>
                </div>
              )}
              {goal.carbsG != null && (
                <div className="text-center">
                  <p className="text-lg font-bold">{goal.carbsG}g</p>
                  <p className="text-xs text-white/70">{t("dashboard.carbs")}</p>
                </div>
              )}
              {goal.fatG != null && (
                <div className="text-center">
                  <p className="text-lg font-bold">{goal.fatG}g</p>
                  <p className="text-xs text-white/70">{t("dashboard.fat")}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-calculated section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            {t("profile.metricsTitle")}
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>
        <MetricsSection userProfile={userProfile} />
      </div>

      {/* Manual override divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          {t("goals.title")}
        </p>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual override form */}
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
                  <FormControl>
                    <Input type="number" min={100} max={10000} className="text-lg font-semibold focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-5 w-5 text-[#E24B4A]" />
                {t("goals.macroTargets")}{" "}
                <span className="font-normal text-muted-foreground text-sm">{t("goals.optional")}</span>
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
                      <Input
                        type="number" min={0} step={0.1}
                        placeholder={t("goals.notSet")}
                        className="focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-[#E24B4A] hover:bg-[#c93d3c] text-white"
            disabled={saving}
          >
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("goals.saving")}</>
              : t("goals.save")}
          </Button>
        </form>
      </Form>
    </div>
  )
}
