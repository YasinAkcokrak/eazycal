"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Camera, History, Target, User, LogOut, ShieldCheck, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface AppSidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

const LANGUAGES = [
  { code: "en", flag: "🇺🇸" },
  { code: "tr", flag: "🇹🇷" },
  { code: "es", flag: "🇪🇸" },
] as const

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function LanguageSwitcher() {
  const router = useRouter()
  const t = useTranslations("language")

  function setLocale(code: string) {
    localStorage.setItem("locale", code)
    document.cookie = `locale=${code}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  const current = typeof window !== "undefined"
    ? (localStorage.getItem("locale") ?? "en")
    : "en"

  const currentFlag = LANGUAGES.find((l) => l.code === current)?.flag ?? "🇺🇸"

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground px-3 mb-1">{t("label")}</p>
      <div className="flex gap-1 px-1">
        {LANGUAGES.map(({ code, flag }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            title={t(code as "en" | "tr" | "es")}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all",
              current === code
                ? "bg-[#E24B4A]/10 text-[#E24B4A] ring-1 ring-[#E24B4A]/30"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            {flag}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("nav")

  const nav = [
    { href: "/dashboard", label: t("dashboard"),  icon: LayoutDashboard },
    { href: "/scan",      label: t("scanMeal"),   icon: Camera },
    { href: "/history",   label: t("history"),    icon: History },
    { href: "/goals",     label: t("goals"),      icon: Target },
    { href: "/profile",   label: t("profile"),    icon: User },
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r bg-card z-30">

        {/* Logo */}
        <div className="p-6 border-b flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#E24B4A] flex items-center justify-center shrink-0">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold">EazyCal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[#E24B4A] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-[#E24B4A] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("admin")}
            </Link>
          )}
        </nav>

        {/* Language + User */}
        <div className="p-4 border-t space-y-4">
          <LanguageSwitcher />
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-[#E24B4A]/30">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-[#E24B4A]/10 text-[#E24B4A] font-semibold text-sm">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("signOut")}
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card z-30 flex">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-[#E24B4A]" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
              {label.split(" ")[0]}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
