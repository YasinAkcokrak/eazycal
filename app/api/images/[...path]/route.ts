import { NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { auth } from "@/lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { path } = await params
  const pathname = path.join("/")

  try {
    const result = await get(pathname, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    if (!result) {
      return new NextResponse("Not found", { status: 404 })
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
