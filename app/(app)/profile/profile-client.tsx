"use client"

import { useState } from "react"
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
import { Separator } from "@/components/ui/separator"

interface Props {
  user: { id: string; name: string | null; email: string; image: string | null; createdAt: string }
  stats: { totalScans: number }
}

const nameSchema = z.object({ name: z.string().min(1).max(100) })
const passwordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })

type NameValues = z.infer<typeof nameSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function ProfileClient({ user, stats }: Props) {
  const [nameSaving, setNameSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user.name ?? "" },
  })

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  })

  async function onSaveName(values: NameValues) {
    setNameSaving(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name }),
    })
    setNameSaving(false)
    res.ok ? toast.success("Name updated") : toast.error("Failed to update name")
  }

  async function onSavePassword(values: PasswordValues) {
    setPwSaving(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    })
    setPwSaving(false)
    if (res.ok) {
      toast.success("Password updated")
      pwForm.reset()
    } else {
      toast.error("Failed to update password")
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Avatar + stats */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xl">{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.name ?? "User"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.totalScans} meals logged</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit name */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onSaveName)} className="flex gap-2">
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={nameSaving}>
                {nameSaving ? "Saving..." : "Save"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...pwForm}>
            <form onSubmit={pwForm.handleSubmit(onSavePassword)} className="space-y-4">
              <FormField
                control={pwForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Sign out */}
      <Button
        variant="destructive"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </Button>
    </div>
  )
}
