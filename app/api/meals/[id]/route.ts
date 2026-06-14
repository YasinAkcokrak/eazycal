import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { MealType } from "@prisma/client"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  mealType: z.nativeEnum(MealType).optional(),
  calories: z.number().int().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.meal.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { name, mealType, calories, protein_g, carbs_g, fat_g } = result.data

  const meal = await prisma.meal.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(mealType && { mealType }),
      ...(calories !== undefined && { calories }),
      ...(protein_g !== undefined && { proteinG: protein_g }),
      ...(carbs_g !== undefined && { carbsG: carbs_g }),
      ...(fat_g !== undefined && { fatG: fat_g }),
    },
  })

  return NextResponse.json(meal)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.meal.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.meal.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
