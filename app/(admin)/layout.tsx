import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Users, BarChart3, Camera } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r bg-card z-30">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">Admin</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">CalorieLens</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", label: "Overview", icon: BarChart3 },
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/admin/scan-logs", label: "Scan Logs", icon: Camera },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <div className="container mx-auto p-4 md:p-6 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}
