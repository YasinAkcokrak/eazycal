import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register")
  const isAdminPage = nextUrl.pathname.startsWith("/admin")
  const isAppPage = ["/dashboard", "/scan", "/history", "/goals", "/profile"].some(
    (p) => nextUrl.pathname.startsWith(p),
  )

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if ((isAppPage || isAdminPage) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isAdminPage && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/history/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}
