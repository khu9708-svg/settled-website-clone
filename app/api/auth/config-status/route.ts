import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      googleConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    })
  } catch {
    return NextResponse.json({ googleConfigured: false })
  }
}
