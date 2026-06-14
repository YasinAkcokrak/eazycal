import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { name, email, password } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password: hashed },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
