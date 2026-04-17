import { NextResponse } from "next/server"
import { applySubscriptionBatch } from "@/lib/library/subscriptions/service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await applySubscriptionBatch({
      ids: Array.isArray(body?.ids) ? body.ids : [],
      action: body?.action,
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply batch action."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
