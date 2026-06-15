import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as never),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize called, email:", credentials?.email ?? "(none)")
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[auth] authorize: missing email or password")
            return null
          }

          let user
          try {
            user = await prisma.user.findUnique({
              where: { email: credentials.email as string },
            })
            console.log("[auth] db query ok, user found:", user ? `yes (id=${user.id}, isActive=${user.isActive}, hasPassword=${!!user.password})` : "no")
          } catch (dbErr) {
            console.error("[auth] prisma query failed:", dbErr)
            return null
          }

          if (!user || !user.password) return null
          if (!user.isActive) {
            console.log("[auth] user is not active, returning null")
            return null
          }

          let valid: boolean
          try {
            valid = await bcrypt.compare(
              credentials.password as string,
              user.password,
            )
            console.log("[auth] password match:", valid)
          } catch (bcryptErr) {
            console.error("[auth] bcrypt.compare failed:", bcryptErr)
            return null
          }

          if (!valid) return null

          const returnValue = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
          console.log("[auth] authorize returning user id:", returnValue.id)
          return returnValue
        } catch (err) {
          console.error("[auth] authorize unexpected error:", err)
          return null
        }
      },
    }),
  ],
})
