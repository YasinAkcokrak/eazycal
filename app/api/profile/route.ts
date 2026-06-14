import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { name, password } = result.data
  const data: Record<string, string> = {}

  if (name) data.name = name
  if (password) data.password = await bcrypt.hash(password, 12)

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user)
}
