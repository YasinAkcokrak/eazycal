import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token")

  const protectedPaths = ["/dashboard", "/scan", "/history", "/goals", "/profile", "/admin", "/onboarding"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/history/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
}
