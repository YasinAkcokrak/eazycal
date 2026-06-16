"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Camera, Upload, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

const saveSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  calories: z.coerce.number().int().min(0),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
})
type SaveValues = z.infer<typeof saveSchema>

const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Breakfast", emoji: "🌅" },
  { value: "LUNCH",     label: "Lunch",     emoji: "☀️" },
  { value: "DINNER",    label: "Dinner",    emoji: "🌙" },
  { value: "SNACK",     label: "Snack",     emoji: "🍎" },
] as const

const CONFIDENCE_CONFIG = {
  high:   { label: "High confidence",   color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium confidence", color: "bg-amber-100 text-amber-700" },
  low:    { label: "Low confidence",    color: "bg-red-100 text-red-700" },
}

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
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SaveValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(saveSchema) as any,
    defaultValues: { name: "", mealType: defaultMealType(), calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  })

  function handleFile(f: File) {
    setFile(f); setResult(null)
    setPreview(URL.createObjectURL(f))
  }

  async function analyze() {
    if (!file) return
    setAnalyzing(true)
    const resized = await resizeImage(file)
    const fd = new FormData()
    fd.append("image", resized)
    const res = await fetch("/api/analyze", { method: "POST", body: fd })
    setAnalyzing(false)
    if (!res.ok) { toast.error("Analysis failed — try again"); return }
    const data: NutritionResult = await res.json()
    setResult(data)
    form.reset({
      name: data.meal_name,
      mealType: defaultMealType(),
      calories: data.calories,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fat_g: data.fat_g,
    })
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
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save meal"); return }
    toast.success("Meal saved!")
    router.push("/dashboard")
  }

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Scan a Meal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Take a photo and let AI estimate the calories</p>
      </div>

      {/* Camera / upload area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {preview ? (
            <div>
              <div className="relative aspect-[4/3] bg-black">
                <Image src={preview} alt="Meal preview" fill className="object-contain" />
              </div>
              <div className="flex gap-2 p-4">
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
                <Button
                  className="flex-1 bg-[#E24B4A] hover:bg-[#c93d3c] text-white"
                  onClick={analyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Analyze</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="h-36 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors group"
              >
                <Camera className="h-8 w-8 text-muted-foreground group-hover:text-[#E24B4A] transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-36 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors group"
              >
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-[#E24B4A] transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Upload Photo</span>
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </CardContent>
      </Card>

      {/* Result card */}
      {result && (
        <Card>
          <CardContent className="pt-5 space-y-5">
            {/* Calorie hero + confidence */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", CONFIDENCE_CONFIG[result.confidence].color)}>
                  {CONFIDENCE_CONFIG[result.confidence].label}
                </span>
              </div>
              <p className="text-5xl font-bold text-[#E24B4A]">{result.calories}</p>
              <p className="text-sm text-muted-foreground">calories</p>
              {result.notes && <p className="text-xs text-muted-foreground mt-2 italic">{result.notes}</p>}
            </div>

            {/* Macro pills */}
            <div className="flex gap-2 justify-center flex-wrap">
              <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">P {result.protein_g.toFixed(0)}g</span>
              <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">C {result.carbs_g.toFixed(0)}g</span>
              <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">F {result.fat_g.toFixed(0)}g</span>
            </div>

            <hr className="border-border" />

            {/* Edit form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pill meal type selector */}
                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <div className="flex gap-2 flex-wrap">
                        {MEAL_TYPES.map(({ value, label, emoji }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
                              field.value === value
                                ? "bg-[#E24B4A] text-white border-[#E24B4A] shadow-sm"
                                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                            )}
                          >
                            {emoji} {label}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((key) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {key === "calories" ? "Calories (kcal)" : key === "protein_g" ? "Protein (g)" : key === "carbs_g" ? "Carbs (g)" : "Fat (g)"}
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step={key === "calories" ? 1 : 0.1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#E24B4A] hover:bg-[#c93d3c] text-white h-12 text-base font-semibold"
                  disabled={saving}
                >
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save to Today"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
