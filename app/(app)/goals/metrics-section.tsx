"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Beef, Wheat, Droplets, Flame, Dumbbell, Calculator, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UserProfileData {
  age: number
  gender: string
  weightKg: number
  heightCm: number
  activityLevel: string
  weeklyWorkoutDays: number
  goalType: string
}

interface Props {
  userProfile: UserProfileData | null
}

const metricsSchema = z.object({
  age: z.coerce.number().int().min(10).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  weightKg: z.coerce.number().min(20).max(500),
  heightCm: z.coerce.number().min(50).max(300),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
  weeklyWorkoutDays: z.coerce.number().int().min(0).max(7),
  goalType: z.enum(["LOSE_WEIGHT", "MAINTAIN", "GAIN_MUSCLE"]),
})

type MetricsValues = z.infer<typeof metricsSchema>

function computeTDEE(values: MetricsValues): number {
  const base = 10 * values.weightKg + 6.25 * values.heightCm - 5 * values.age
  const bmr =
    values.gender === "MALE" ? base + 5 : values.gender === "FEMALE" ? base - 161 : base - 78
  const multiplier: Record<string, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  }
  const adjustment: Record<string, number> = {
    LOSE_WEIGHT: -500,
    MAINTAIN: 0,
    GAIN_MUSCLE: 300,
  }
  return Math.round(bmr * multiplier[values.activityLevel] + adjustment[values.goalType])
}

export default function MetricsSection({ userProfile }: Props) {
  const t = useTranslations("profile.metrics")
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<MetricsValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(metricsSchema) as any,
    defaultValues: {
      age: userProfile?.age ?? 25,
      gender: (userProfile?.gender as MetricsValues["gender"]) ?? "MALE",
      weightKg: userProfile?.weightKg ?? 70,
      heightCm: userProfile?.heightCm ?? 170,
      activityLevel: (userProfile?.activityLevel as MetricsValues["activityLevel"]) ?? "MODERATE",
      weeklyWorkoutDays: userProfile?.weeklyWorkoutDays ?? 3,
      goalType: (userProfile?.goalType as MetricsValues["goalType"]) ?? "MAINTAIN",
    },
  })

  const values = form.watch()

  const { tdee, protein, fat, carbs } = useMemo(() => {
    const result = metricsSchema.safeParse(values)
    if (!result.success) return { tdee: null, protein: null, fat: null, carbs: null }
    const tdee = Math.max(1200, computeTDEE(result.data))
    const protein = Math.round(result.data.weightKg * 2)
    const fat = Math.round(result.data.weightKg * 0.8)
    const carbs = Math.max(0, Math.round((tdee - protein * 4 - fat * 9) / 4))
    return { tdee, protein, fat, carbs }
  }, [values])

  async function onSave(data: MetricsValues) {
    setSaving(true)
    const res = await fetch("/api/profile/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error(t("saveFailed"))
      return
    }
    toast.success(t("savedMetrics"))
    router.refresh()
  }

  const inputCls = "focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]"

  const genderOptions: { value: MetricsValues["gender"]; label: string }[] = [
    { value: "MALE", label: t("male") },
    { value: "FEMALE", label: t("female") },
    { value: "OTHER", label: t("other") },
  ]

  const activityOptions: { value: MetricsValues["activityLevel"]; label: string; desc: string }[] = [
    { value: "SEDENTARY",  label: t("sedentary"),  desc: t("sedentaryDesc") },
    { value: "LIGHT",      label: t("light"),      desc: t("lightDesc") },
    { value: "MODERATE",   label: t("moderate"),   desc: t("moderateDesc") },
    { value: "ACTIVE",     label: t("active"),     desc: t("activeDesc") },
    { value: "VERY_ACTIVE",label: t("veryActive"), desc: t("veryActiveDesc") },
  ]

  const goalTypes: MetricsValues["goalType"][] = ["LOSE_WEIGHT", "MAINTAIN", "GAIN_MUSCLE"]
  const goalLabels: Record<MetricsValues["goalType"], string> = {
    LOSE_WEIGHT: t("loseWeight"),
    MAINTAIN: t("maintain"),
    GAIN_MUSCLE: t("gainMuscle"),
  }
  const workoutRec: Record<MetricsValues["goalType"], string> = {
    LOSE_WEIGHT: t("workoutRecLose"),
    MAINTAIN: t("workoutRecMaintain"),
    GAIN_MUSCLE: t("workoutRecGain"),
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5 text-[#E24B4A]" />
            {t("title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">

              {/* Age + Weight + Height row */}
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("age")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={10} max={120} className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weightKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("weightKg")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={20} max={500} step={0.1} className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heightCm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("heightCm")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={50} max={300} step={0.1} className={inputCls} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Gender — pill buttons */}
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("gender")}</FormLabel>
                  <div className="flex gap-2">
                    {genderOptions.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                          field.value === value
                            ? "bg-[#E24B4A] text-white border-[#E24B4A] shadow-sm"
                            : "border-border text-muted-foreground hover:border-[#E24B4A]/60 hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Activity Level — card pills */}
              <FormField control={form.control} name="activityLevel" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("activityLevel")}</FormLabel>
                  <div className="space-y-2">
                    {activityOptions.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                          field.value === value
                            ? "bg-[#E24B4A]/5 border-[#E24B4A] ring-1 ring-[#E24B4A]/30"
                            : "border-border hover:border-[#E24B4A]/40 hover:bg-muted/40"
                        )}
                      >
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 transition-colors",
                          field.value === value ? "bg-[#E24B4A]" : "bg-muted-foreground/30"
                        )} />
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-medium leading-none",
                            field.value === value ? "text-[#E24B4A]" : "text-foreground"
                          )}>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Weekly Workout Days */}
              <FormField control={form.control} name="weeklyWorkoutDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("weeklyWorkouts")}</FormLabel>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 8 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => field.onChange(i)}
                        className={cn(
                          "flex-1 h-9 rounded-lg text-sm font-medium border transition-colors",
                          Number(field.value) === i
                            ? "bg-[#E24B4A] text-white border-[#E24B4A] shadow-sm"
                            : "border-border hover:border-[#E24B4A]/60 text-foreground"
                        )}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Goal Type */}
              <FormField control={form.control} name="goalType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("goalType")}</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {goalTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-sm font-medium border transition-all",
                          field.value === type
                            ? "bg-[#E24B4A] text-white border-[#E24B4A] shadow-sm"
                            : "border-border hover:border-[#E24B4A]/60 text-foreground"
                        )}
                      >
                        {goalLabels[type]}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-[#E24B4A] hover:bg-[#c93d3c] text-white gap-2"
                disabled={saving}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{t("saving")}</>
                  : <><Sparkles className="h-4 w-4" />{t("saveMetrics")}</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Live TDEE result — shown as insight reward */}
      {tdee !== null && (
        <Card className="border-[#E24B4A]/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#E24B4A] to-orange-400" />
          <CardContent className="pt-5 space-y-4">
            {/* Headline */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#E24B4A]/10 flex items-center justify-center shrink-0">
                <Flame className="h-6 w-6 text-[#E24B4A]" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("yourPlan")}</p>
                <p className="text-3xl font-bold text-[#E24B4A] leading-none">
                  {tdee.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">{t("kcalDay")}</span>
                </p>
              </div>
            </div>

            {/* Macro breakdown */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                <Beef className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{protein}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("protein")}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                <Wheat className="h-4 w-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{carbs}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("carbs")}</p>
              </div>
              <div className="rounded-xl bg-green-50 dark:bg-green-950/20 p-3 text-center">
                <Droplets className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{fat}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("fat")}</p>
              </div>
            </div>

            {/* Workout rec */}
            <div className="flex items-start gap-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 p-3">
              <Dumbbell className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-0.5">{t("weeklyWorkoutRec")}</p>
                <p className="text-sm text-muted-foreground">{workoutRec[values.goalType as MetricsValues["goalType"]]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
