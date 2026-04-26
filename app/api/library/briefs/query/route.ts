import { NextResponse } from "next/server"
import { queryBriefs } from "@/lib/library/briefs/service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items = await queryBriefs({
      keywords: Array.isArray(body?.keywords) ? body.keywords : [],
      topic: typeof body?.topic === "string" ? body.topic : undefined,
      targetModule: typeof body?.targetModule === "string" ? body.targetModule : undefined,
      difficulty: typeof body?.difficulty === "string" ? body.difficulty : undefined,
      ageGroup: typeof body?.ageGroup === "string" ? body.ageGroup : undefined,
      language: typeof body?.language === "string" ? body.language : undefined,
      limit: typeof body?.limit === "number" ? body.limit : undefined,
      shuffleSeed: typeof body?.shuffleSeed === "string" ? body.shuffleSeed : undefined,
    })

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query briefs."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
