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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Beef, Wheat, Droplets, Flame, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfileData {
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-5">
              {/* Age + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("age")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={10} max={120} className={inputCls} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("gender")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputCls}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">{t("male")}</SelectItem>
                          <SelectItem value="FEMALE">{t("female")}</SelectItem>
                          <SelectItem value="OTHER">{t("other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Weight + Height */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("weightKg")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={20} max={500} step={0.1} className={inputCls} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heightCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("heightCm")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={50} max={300} step={0.1} className={inputCls} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Activity Level */}
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("activityLevel")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={inputCls}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SEDENTARY">
                          {t("sedentary")} — {t("sedentaryDesc")}
                        </SelectItem>
                        <SelectItem value="LIGHT">
                          {t("light")} — {t("lightDesc")}
                        </SelectItem>
                        <SelectItem value="MODERATE">
                          {t("moderate")} — {t("moderateDesc")}
                        </SelectItem>
                        <SelectItem value="ACTIVE">
                          {t("active")} — {t("activeDesc")}
                        </SelectItem>
                        <SelectItem value="VERY_ACTIVE">
                          {t("veryActive")} — {t("veryActiveDesc")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Weekly Workout Days */}
              <FormField
                control={form.control}
                name="weeklyWorkoutDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("weeklyWorkouts")}</FormLabel>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 8 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => field.onChange(i)}
                          className={cn(
                            "flex-1 h-9 rounded-md text-sm font-medium border transition-colors",
                            Number(field.value) === i
                              ? "bg-[#E24B4A] text-white border-[#E24B4A]"
                              : "border-border hover:border-[#E24B4A]/60 text-foreground"
                          )}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Goal Type */}
              <FormField
                control={form.control}
                name="goalType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("goalType")}</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {goalTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={cn(
                            "py-2.5 px-2 rounded-lg text-sm font-medium border transition-colors",
                            field.value === type
                              ? "bg-[#E24B4A] text-white border-[#E24B4A]"
                              : "border-border hover:border-[#E24B4A]/60 text-foreground"
                          )}
                        >
                          {goalLabels[type]}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#E24B4A] hover:bg-[#c93d3c] text-white font-semibold"
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("saving")}</>
                ) : (
                  t("saveMetrics")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Live TDEE / macro result */}
      {tdee !== null && (
        <Card className="border-[#E24B4A]/20 bg-red-50/40 dark:bg-red-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("yourPlan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Daily calorie target */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#E24B4A]/10 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-[#E24B4A]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("dailyCalories")}</p>
                <p className="text-2xl font-bold text-[#E24B4A] leading-none">
                  {tdee.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t("kcalDay")}</span>
                </p>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-background border p-3 text-center">
                <Beef className="h-4 w-4 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{protein}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("protein")}</p>
              </div>
              <div className="rounded-xl bg-background border p-3 text-center">
                <Wheat className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{carbs}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("carbs")}</p>
              </div>
              <div className="rounded-xl bg-background border p-3 text-center">
                <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{fat}{t("grams")}</p>
                <p className="text-xs text-muted-foreground">{t("fat")}</p>
              </div>
            </div>

            {/* Weekly workout recommendation */}
            <div className="flex items-start gap-3 rounded-xl bg-background border p-3">
              <Dumbbell className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{t("weeklyWorkoutRec")}</p>
                <p className="text-sm">{workoutRec[values.goalType as MetricsValues["goalType"]]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
