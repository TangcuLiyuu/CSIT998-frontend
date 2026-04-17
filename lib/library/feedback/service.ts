import { LIBRARY_DEFAULT_USER_ID } from "@/lib/library/constants"
import { upsertBriefFeedback } from "@/lib/library/feedback/repository"
import type { BriefFeedbackValue } from "@/lib/library/types"

export async function saveBriefFeedback(briefId: string, value: BriefFeedbackValue, userId?: string) {
  if (value !== "up" && value !== "down") {
    throw new Error("Feedback value must be 'up' or 'down'.")
  }

  const now = new Date().toISOString()
  const record = await upsertBriefFeedback({
    id: `feedback-${crypto.randomUUID()}`,
    briefId,
    userId: userId || LIBRARY_DEFAULT_USER_ID,
    value,
    createdAt: now,
    updatedAt: now,
  })

  return { success: true, item: record }
}
