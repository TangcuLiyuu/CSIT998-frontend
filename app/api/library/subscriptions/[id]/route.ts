import { NextResponse } from "next/server"
import {
  removeLibrarySubscription,
  updateLibrarySubscription,
} from "@/lib/library/subscriptions/service"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const item = await updateLibrarySubscription(id, {
      title: body?.title,
      intent: body?.intent,
      frequency: body?.frequency,
      status: body?.status,
    })
    return NextResponse.json({ item })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update subscription."
    const status = message === "Subscription not found." ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await removeLibrarySubscription(id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete subscription."
    const status = message === "Subscription not found." ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
