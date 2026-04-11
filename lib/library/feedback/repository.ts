import { getLibraryStore } from "@/lib/library/db"
import type { LibraryBriefFeedbackRecord } from "@/lib/library/types"

function copyRecord(item: LibraryBriefFeedbackRecord): LibraryBriefFeedbackRecord {
  return { ...item }
}

export async function upsertBriefFeedback(record: LibraryBriefFeedbackRecord): Promise<LibraryBriefFeedbackRecord> {
  const store = getLibraryStore()
  const index = store.feedback.findIndex(
    (item) => item.userId === record.userId && item.briefId === record.briefId,
  )

  if (index >= 0) {
    store.feedback[index] = record
    return copyRecord(record)
  }

  store.feedback.push(record)
  return copyRecord(record)
}
