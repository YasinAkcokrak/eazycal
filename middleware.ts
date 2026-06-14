export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/history/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
}
