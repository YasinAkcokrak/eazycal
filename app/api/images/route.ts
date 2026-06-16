import { NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 })
  }

  if (!url.includes(".blob.vercel-storage.com")) {
    return new NextResponse("Invalid URL", { status: 400 })
  }

  try {
    const result = await get(url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    if (!result) {
      return new NextResponse("Image not found", { status: 404 })
    }

    const contentType = result.headers.get("content-type") ?? "image/jpeg"

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[images] blob fetch error:", err)
    return new NextResponse("Image not found", { status: 404 })
  }
}
