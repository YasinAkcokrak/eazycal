"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Monitor,
  Activity,
  Bike,
  Dumbbell,
  Flame,
  TrendingDown,
  TrendingUp,
  Target,
  CheckCircle2,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react"

type Gender = "MALE" | "FEMALE" | "OTHER"
type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE"
type GoalType = "LOSE_WEIGHT" | "MAINTAIN" | "GAIN_MUSCLE"

interface FormData {
  name: string
  age: string
  gender: Gender | ""
  weightKg: string
  heightCm: string
  activityLevel: ActivityLevel | ""
  weeklyWorkoutDays: number
  goalType: GoalType | ""
}

function computeTDEE(
  age: number,
  gender: Gender,
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  goalType: GoalType
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const bmr = gender === "MALE" ? base + 5 : gender === "FEMALE" ? base - 161 : base - 78
  const multiplier: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  }
  const adjustment: Record<GoalType, number> = {
    LOSE_WEIGHT: -500,
    MAINTAIN: 0,
    GAIN_MUSCLE: 300,
  }
  return Math.round(bmr * multiplier[activityLevel] + adjustment[goalType])
}

const ACTIVITY_OPTIONS: {
  key: ActivityLevel
  labelKey: string
  descKey: string
  Icon: React.ElementType
}[] = [
  { key: "SEDENTARY", labelKey: "sedentary", descKey: "sedentaryDesc", Icon: Monitor },
  { key: "LIGHT", labelKey: "light", descKey: "lightDesc", Icon: Activity },
  { key: "MODERATE", labelKey: "moderate", descKey: "moderateDesc", Icon: Bike },
  { key: "ACTIVE", labelKey: "active", descKey: "activeDesc", Icon: Dumbbell },
  { key: "VERY_ACTIVE", labelKey: "veryActive", descKey: "veryActiveDesc", Icon: Flame },
]

const GOAL_OPTIONS: {
  key: GoalType
  labelKey: string
  descKey: string
  Icon: React.ElementType
}[] = [
  { key: "LOSE_WEIGHT", labelKey: "loseWeight", descKey: "loseWeightDesc", Icon: TrendingDown },
  { key: "MAINTAIN", labelKey: "maintain", descKey: "maintainDesc", Icon: Target },
  { key: "GAIN_MUSCLE", labelKey: "gainMuscle", descKey: "gainMuscleDesc", Icon: TrendingUp },
]

const TOTAL_STEPS = 4

interface SelectCardProps {
  selected: boolean
  onClick: () => void
  Icon: React.ElementType
  label: string
  desc: string
}

function SelectCard({ selected, onClick, Icon, label, desc }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
        selected ? "border-[#E24B4A] bg-[#E24B4A]/5" : "border-border hover:border-[#E24B4A]/40"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-[#E24B4A]/10" : "bg-muted"
        )}
      >
        <Icon
          className={cn("h-5 w-5", selected ? "text-[#E24B4A]" : "text-muted-foreground")}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {selected && <CheckCircle2 className="h-5 w-5 text-[#E24B4A] shrink-0" />}
    </button>
  )
}

export default function OnboardingClient({ userName }: { userName: string }) {
  const t = useTranslations("onboarding")
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<FormData>({
    name: userName,
    age: "",
    gender: "",
    weightKg: "",
    heightCm: "",
    activityLevel: "",
    weeklyWorkoutDays: 3,
    goalType: "",
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const canAdvance =
    (step === 1 && data.name.trim().length > 0 && Number(data.age) >= 10 && data.gender !== "") ||
    (step === 2 && Number(data.weightKg) >= 20 && Number(data.heightCm) >= 50) ||
    (step === 3 && data.activityLevel !== "") ||
    (step === 4 && data.goalType !== "")

  const tdeeResult = useMemo(() => {
    if (
      !data.goalType ||
      !data.activityLevel ||
      !data.gender ||
      Number(data.age) < 10 ||
      Number(data.weightKg) < 20 ||
      Number(data.heightCm) < 50
    )
      return null
    const tdee = Math.max(
      1200,
      computeTDEE(
        Number(data.age),
        data.gender as Gender,
        Number(data.weightKg),
        Number(data.heightCm),
        data.activityLevel as ActivityLevel,
        data.goalType as GoalType
      )
    )
    const protein = Math.round(Number(data.weightKg) * 2)
    const fat = Math.round(Number(data.weightKg) * 0.8)
    const carbs = Math.max(0, Math.round((tdee - protein * 4 - fat * 9) / 4))
    return { tdee, protein, fat, carbs }
  }, [data])

  async function handleFinish() {
    setSaving(true)
    try {
      if (data.name.trim() !== userName) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name.trim() }),
        })
      }
      const res = await fetch("/api/profile/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(data.age),
          gender: data.gender,
          weightKg: Number(data.weightKg),
          heightCm: Number(data.heightCm),
          activityLevel: data.activityLevel,
          weeklyWorkoutDays: data.weeklyWorkoutDays,
          goalType: data.goalType,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      router.push("/dashboard")
    } catch {
      toast.error(t("saveFailed"))
      setSaving(false)
    }
  }

  const inputCls = "focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky header with progress */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center max-w-md mx-auto">
          <span className="text-lg font-bold text-[#E24B4A]">EazyCal</span>
          <span className="ml-auto text-sm font-medium text-muted-foreground">
            {t("stepOf", { step, total: TOTAL_STEPS })}
          </span>
        </div>
        <div className="mt-2.5 max-w-md mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E24B4A] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8">

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{t("step1Title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("step1Subtitle")}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("name")}</Label>
                  <Input
                    className={inputCls}
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Smith"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("age")}</Label>
                  <Input
                    type="number"
                    className={inputCls}
                    value={data.age}
                    onChange={(e) => update("age", e.target.value)}
                    placeholder="25"
                    min={10}
                    max={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("gender")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => update("gender", g)}
                        className={cn(
                          "relative py-4 rounded-xl border-2 text-sm font-medium text-center transition-all",
                          data.gender === g
                            ? "border-[#E24B4A] bg-[#E24B4A]/5 text-[#E24B4A]"
                            : "border-border hover:border-[#E24B4A]/40 text-foreground"
                        )}
                      >
                        {data.gender === g && (
                          <CheckCircle2 className="h-3.5 w-3.5 absolute top-1.5 right-1.5 text-[#E24B4A]" />
                        )}
                        {g === "MALE" ? t("male") : g === "FEMALE" ? t("female") : t("other")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Body Metrics ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{t("step2Title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("step2Subtitle")}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("weightKg")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className={cn(inputCls, "pr-12 text-lg")}
                      value={data.weightKg}
                      onChange={(e) => update("weightKg", e.target.value)}
                      placeholder="70"
                      min={20}
                      max={500}
                      step={0.1}
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                      {t("kg")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("heightCm")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className={cn(inputCls, "pr-12 text-lg")}
                      value={data.heightCm}
                      onChange={(e) => update("heightCm", e.target.value)}
                      placeholder="170"
                      min={50}
                      max={300}
                      step={0.1}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                      {t("cm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Activity Level + Workout Days ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{t("step3Title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("step3Subtitle")}</p>
              </div>

              <div className="space-y-2">
                {ACTIVITY_OPTIONS.map(({ key, labelKey, descKey, Icon }) => (
                  <SelectCard
                    key={key}
                    selected={data.activityLevel === key}
                    onClick={() => update("activityLevel", key)}
                    Icon={Icon}
                    label={t(labelKey)}
                    desc={t(descKey)}
                  />
                ))}
              </div>

              <div className="space-y-2.5">
                <Label>
                  {t("weeklyWorkouts")}:{" "}
                  <span className="font-bold text-[#E24B4A]">{data.weeklyWorkoutDays}</span>
                </Label>
                <div className="flex gap-1.5">
                  {Array.from({ length: 8 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => update("weeklyWorkoutDays", i)}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-sm font-medium border transition-colors",
                        data.weeklyWorkoutDays === i
                          ? "bg-[#E24B4A] text-white border-[#E24B4A]"
                          : "border-border hover:border-[#E24B4A]/60 text-foreground"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Goal Selection ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">{t("step4Title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("step4Subtitle")}</p>
              </div>

              <div className="space-y-3">
                {GOAL_OPTIONS.map(({ key, labelKey, descKey, Icon }) => (
                  <SelectCard
                    key={key}
                    selected={data.goalType === key}
                    onClick={() => update("goalType", key)}
                    Icon={Icon}
                    label={t(labelKey)}
                    desc={t(descKey)}
                  />
                ))}
              </div>

              {/* Live TDEE result */}
              {tdeeResult && (
                <div className="rounded-xl border border-[#E24B4A]/20 bg-[#E24B4A]/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-[#E24B4A]" />
                    <p className="text-sm font-semibold text-[#E24B4A]">{t("yourTarget")}</p>
                  </div>
                  <p className="text-3xl font-bold text-[#E24B4A] leading-none">
                    {tdeeResult.tdee.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">
                      {t("kcalDay")}
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      {
                        label: t("protein"),
                        value: tdeeResult.protein,
                        Icon: Beef,
                        color: "text-red-500",
                      },
                      {
                        label: t("carbs"),
                        value: tdeeResult.carbs,
                        Icon: Wheat,
                        color: "text-amber-500",
                      },
                      {
                        label: t("fat"),
                        value: tdeeResult.fat,
                        Icon: Droplets,
                        color: "text-blue-500",
                      },
                    ].map(({ label, value, Icon: MacroIcon, color }) => (
                      <div
                        key={label}
                        className="bg-background rounded-lg border p-2.5 text-center"
                      >
                        <MacroIcon className={cn("h-4 w-4 mx-auto mb-1", color)} />
                        <p className={cn("text-base font-bold leading-none", color)}>
                          {value}
                          {t("grams")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer navigation */}
      <footer className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/50 p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          {step > 1 && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </Button>
          )}
          <Button
            className="flex-1 gap-1.5 bg-[#E24B4A] hover:bg-[#c93d3c] text-white font-semibold"
            disabled={!canAdvance || saving}
            onClick={step < TOTAL_STEPS ? () => setStep((s) => s + 1) : handleFinish}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : step < TOTAL_STEPS ? (
              <>
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              t("finish")
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
