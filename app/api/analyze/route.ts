import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { analyzeImage } from "@/lib/gemini"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("image") as File | null

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString("base64")

  const nutrition = await analyzeImage(base64, file.type)

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `meals/${session.user.id}/${Date.now()}.${ext}`
  const blob = await put(filename, buffer, { access: "public", contentType: file.type })

  return NextResponse.json({
    ...nutrition,
    image_url: blob.url,
  })
}
