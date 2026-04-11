import { NextResponse } from "next/server"
import { saveBriefFeedback } from "@/lib/library/feedback/service"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const result = await saveBriefFeedback(id, body?.value ?? null)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save feedback."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
