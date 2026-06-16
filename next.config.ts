import type { NextConfig } from "next"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    localPatterns: [
      { pathname: "/api/images", search: "*" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
}

export default withPWA(nextConfig)
