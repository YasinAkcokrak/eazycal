import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    localPatterns: [
      { pathname: "/api/images", search: "*" },
      { pathname: "/api/images/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
}

export default withNextIntl(withPWA(nextConfig))
