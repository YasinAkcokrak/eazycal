"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Camera, History, Target, User, LogOut, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Meal", icon: Camera },
  { href: "/history", label: "History", icon: History },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
]

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r bg-card z-30">
        <div className="p-6 border-b">
          <span className="text-xl font-bold text-primary">CalorieLens</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin
            </Link>
          )}
        </nav>

        <div className="p-4 border-t space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card z-30 flex">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs",
              pathname === href ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </>
  )
}
