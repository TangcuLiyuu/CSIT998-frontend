import { NextResponse } from "next/server"
import {
  createLibrarySubscription,
  getSubscriptions,
} from "@/lib/library/subscriptions/service"

export async function GET() {
  const items = await getSubscriptions()
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const item = await createLibrarySubscription({
      title: body?.title,
      intent: body?.intent,
      frequency: body?.frequency,
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create subscription."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
