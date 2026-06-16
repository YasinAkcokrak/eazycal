"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, X, Loader2, UtensilsCrossed, CalendarDays, Flame, Trophy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import MetricsSection from "./metrics-section"

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
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    createdAt: string
    hasPassword: boolean
  }
  stats: {
    totalMeals: number
    daysTracked: number
    totalCalories: number
    topMealType: string | null
  }
  userProfile: UserProfileData | null
}

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatCalories(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

const editSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.newPassword) return
    if (data.newPassword.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"], message: "At least 8 characters" })
    }
    if (!data.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPassword"], message: "Required to change password" })
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords don't match" })
    }
  })

type EditValues = z.infer<typeof editSchema>

export default function ProfileClient({ user, stats, userProfile }: Props) {
  const t = useTranslations("profile")
  const tMeal = useTranslations("mealTypes")
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<EditValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editSchema) as any,
    defaultValues: { name: user.name ?? "", currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  function openEdit() {
    form.reset({ name: user.name ?? "", currentPassword: "", newPassword: "", confirmPassword: "" })
    setEditing(true)
  }

  function closeEdit() {
    setEditing(false)
    form.reset()
  }

  async function onSave(values: EditValues) {
    setSaving(true)
    const body: Record<string, string> = { name: values.name }
    if (values.newPassword) {
      body.currentPassword = values.currentPassword ?? ""
      body.newPassword = values.newPassword
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.error === "wrongPassword") toast.error(t("wrongPassword"))
      else toast.error(t("updateFailed"))
      return
    }

    toast.success(t("savedChanges"))
    closeEdit()
    router.refresh()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch("/api/profile", { method: "DELETE" })
    if (!res.ok) {
      setDeleting(false)
      toast.error(t("deleteFailed"))
      return
    }
    await signOut({ callbackUrl: "/login" })
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })

  const statItems = [
    {
      label: t("totalMeals"),
      value: stats.totalMeals.toLocaleString(),
      icon: UtensilsCrossed,
      color: "text-[#E24B4A]",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
    {
      label: t("daysTracked"),
      value: stats.daysTracked.toLocaleString(),
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: t("totalCalories"),
      value: formatCalories(stats.totalCalories),
      icon: Flame,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: t("topMealType"),
      value: stats.topMealType
        ? tMeal(stats.topMealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")
        : t("noMealsYet"),
      icon: Trophy,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/20",
    },
  ]

  const inputCls = "focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]"

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-[#E24B4A]/20 shrink-0">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-[#E24B4A]/10 text-[#E24B4A] font-bold text-xl">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate">{user.name ?? "User"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("memberSince")} {memberSince}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={editing ? closeEdit : openEdit}
            >
              {editing ? (
                <><X className="h-3.5 w-3.5" />{t("cancelEdit")}</>
              ) : (
                <><Pencil className="h-3.5 w-3.5" />{t("editProfile")}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("editProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("nameLabel")}</FormLabel>
                      <FormControl>
                        <Input className={inputCls} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {user.hasPassword && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs font-medium text-muted-foreground">{t("changePassword")}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">{t("changePasswordHint")}</p>

                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("currentPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" className={inputCls} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("newPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" className={inputCls} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("confirmPassword")}</FormLabel>
                          <FormControl>
                            <Input type="password" className={inputCls} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeEdit}>
                    {t("cancelEdit")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#E24B4A] hover:bg-[#c93d3c] text-white font-semibold"
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("saving")}</>
                    ) : (
                      t("saveChanges")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("statsTitle")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {statItems.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className={cn("border-0", bg)}>
              <CardContent className="p-4">
                <Icon className={cn("h-4 w-4 mb-2", color)} />
                <p className={cn("text-2xl font-bold leading-none", color)}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Metrics */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("metricsTitle")}
        </p>
        <MetricsSection userProfile={userProfile} />
      </div>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</p>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              {t("deleteCancelButton")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t("deleting")}</>
              ) : (
                t("deleteConfirmButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
