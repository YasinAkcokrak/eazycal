"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
type FormValues = z.infer<typeof schema>

const inputClass = "focus-visible:ring-[#E24B4A] focus-visible:border-[#E24B4A]"

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations("auth.register")
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    setLoading(false)

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? t("failed"))
      return
    }

    toast.success(t("success"))
    router.push("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fullName")}</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("passwordHint")} className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-11 bg-[#E24B4A] hover:bg-[#c93d3c] text-white font-semibold text-base"
            disabled={loading}
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("creatingAccount")}</> : t("createAccount")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-[#E24B4A] font-semibold hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  )
}
