import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AppSidebar from "@/components/app-sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={session.user} />
      <main className="flex-1 overflow-auto md:ml-64">
        <div className="container mx-auto p-4 md:p-6 max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  )
}
