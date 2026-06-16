"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Camera, Upload, Loader2, Sparkles, AlertTriangle, ChefHat, ArrowRight, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"

interface NutritionResult {
  meal_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: "high" | "medium" | "low"
  notes: string
  image_url: string
}

interface FeedbackResult {
  warning: string | null
  suggestion: string | null
  alternativeMeal: string | null
}

const saveSchema = z.object({
  name: z.string().min(1),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  calories: z.coerce.number().int().min(0),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
})
type SaveValues = z.infer<typeof saveSchema>

const MEAL_TYPE_KEYS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const
const MEAL_EMOJI: Record<string, string> = { BREAKFAST: "🌅", LUNCH: "☀️", DINNER: "🌙", SNACK: "🍎" }

function defaultMealType(): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  const h = new Date().getHours()
  if (h < 10) return "BREAKFAST"
  if (h < 14) return "LUNCH"
  if (h < 18) return "SNACK"
  return "DINNER"
}

async function resizeImage(file: File, maxDimension = 1024, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) { height = Math.round((height / width) * maxDimension); width = maxDimension }
        else { width = Math.round((width / height) * maxDimension); height = maxDimension }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width; canvas.height = height
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas resize failed")); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }))
        },
        "image/jpeg", quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")) }
    img.src = objectUrl
  })
}

export default function ScanPage() {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()

  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const [mealSaved, setMealSaved] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SaveValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(saveSchema) as any,
    defaultValues: { name: "", mealType: defaultMealType(), calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  })

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
    setMealSaved(false)
    setFeedback(null)
    setPreview(URL.createObjectURL(f))
  }

  async function analyze() {
    if (!file) return
    setAnalyzing(true)
    setMealSaved(false)
    setFeedback(null)
    const resized = await resizeImage(file)
    const fd = new FormData()
    fd.append("image", resized)
    fd.append("locale", locale)
    const res = await fetch("/api/analyze", { method: "POST", body: fd })
    setAnalyzing(false)
    if (!res.ok) { toast.error(t("scan.analysisFailed")); return }
    const data: NutritionResult = await res.json()
    setResult(data)
    form.reset({ name: data.meal_name, mealType: defaultMealType(), calories: data.calories, protein_g: data.protein_g, carbs_g: data.carbs_g, fat_g: data.fat_g })
  }

  async function onSave(values: SaveValues) {
    setSaving(true)
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        image_url: result?.image_url,
        confidence: result?.confidence?.toUpperCase(),
        ai_notes: result?.notes,
      }),
    })
    if (!res.ok) {
      setSaving(false)
      toast.error(t("scan.saveFailed"))
      return
    }
    toast.success(t("scan.saved"))
    setMealSaved(true)
    setSaving(false)

    // Fetch personalised feedback in the background
    setFeedbackLoading(true)
    try {
      const fbRes = await fetch("/api/meals/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealName: values.name,
          calories: values.calories,
          proteinG: values.protein_g,
          fatG: values.fat_g,
          carbsG: values.carbs_g,
          locale,
        }),
      })
      if (fbRes.ok) setFeedback(await fbRes.json())
    } catch {
      // feedback is non-critical — fail silently
    }
    setFeedbackLoading(false)
  }

  const confidenceLabel: Record<string, string> = {
    high: t("scan.highConfidence"),
    medium: t("scan.mediumConfidence"),
    low: t("scan.lowConfidence"),
  }
  const confidenceColor: Record<string, string> = {
    high: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-red-100 text-red-700",
  }

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">{t("scan.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("scan.subtitle")}</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {preview ? (
            <div>
              <div className="relative aspect-[4/3] bg-black">
                <Image src={preview} alt="Meal preview" fill className="object-contain" />
              </div>
              <div className="flex gap-2 p-4">
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />{t("scan.change")}
                </Button>
                <Button className="flex-1 bg-[#E24B4A] hover:bg-[#c93d3c] text-white" onClick={analyze} disabled={analyzing}>
                  {analyzing
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("scan.analyzing")}</>
                    : <><Sparkles className="h-4 w-4 mr-2" />{t("scan.analyze")}</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { ref: cameraInputRef, capture: true, label: t("scan.takePhoto"), icon: Camera },
                { ref: fileInputRef,   capture: false, label: t("scan.uploadPhoto"), icon: Upload },
              ].map(({ ref, capture, label, icon: Icon }) => (
                <button key={label} type="button" onClick={() => ref.current?.click()}
                  className="h-36 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors group">
                  <Icon className="h-8 w-8 text-muted-foreground group-hover:text-[#E24B4A] transition-colors" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
                </button>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", confidenceColor[result.confidence])}>
                  {confidenceLabel[result.confidence]}
                </span>
              </div>
              <p className="text-5xl font-bold text-[#E24B4A]">{result.calories}</p>
              <p className="text-sm text-muted-foreground">{t("scan.calories").replace(" (kcal)", "")}</p>
              {result.notes && <p className="text-xs text-muted-foreground mt-2 italic">{result.notes}</p>}
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">P {result.protein_g.toFixed(0)}g</span>
              <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">C {result.carbs_g.toFixed(0)}g</span>
              <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">F {result.fat_g.toFixed(0)}g</span>
            </div>

            <hr className="border-border" />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("scan.mealName")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="mealType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("scan.mealType")}</FormLabel>
                    <div className="flex gap-2 flex-wrap">
                      {MEAL_TYPE_KEYS.map((value) => (
                        <button key={value} type="button" onClick={() => field.onChange(value)}
                          className={cn("px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
                            field.value === value
                              ? "bg-[#E24B4A] text-white border-[#E24B4A] shadow-sm"
                              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground")}>
                          {MEAL_EMOJI[value]} {t(`mealTypes.${value}`)}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
                    <FormField key={key} control={form.control} name={key} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t(`scan.${key === "calories" ? "calories" : key === "protein_g" ? "protein" : key === "carbs_g" ? "carbs" : "fat"}`)}</FormLabel>
                        <FormControl><Input type="number" min={0} step={key === "calories" ? 1 : 0.1} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>

                {/* Save button — turns green after save */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 text-base font-semibold gap-2",
                    mealSaved
                      ? "bg-green-500 hover:bg-green-500 text-white"
                      : "bg-[#E24B4A] hover:bg-[#c93d3c] text-white",
                  )}
                  disabled={saving || mealSaved}
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />{t("scan.saving")}</>
                  ) : mealSaved ? (
                    <><CheckCircle2 className="h-4 w-4" />{t("scan.saved")}</>
                  ) : (
                    t("scan.saveToToday")
                  )}
                </Button>

                {/* Feedback section — shown after save */}
                {mealSaved && (
                  <div className="space-y-3 pt-1">
                    {feedbackLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        {t("scan.analyzingFeedback")}
                      </div>
                    )}

                    {feedback?.warning && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-orange-800 dark:text-orange-200">{feedback.warning}</p>
                      </div>
                    )}

                    {feedback?.suggestion && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-green-800 dark:text-green-200">{feedback.suggestion}</p>
                      </div>
                    )}

                    {feedback?.alternativeMeal && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <ChefHat className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {t("scan.tryInstead")}:{" "}
                          <strong>{feedback.alternativeMeal}</strong>
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      className="w-full h-11 gap-2 bg-[#E24B4A] hover:bg-[#c93d3c] text-white font-semibold"
                      onClick={() => router.push("/dashboard")}
                    >
                      {t("scan.goToDashboard")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
