import { LIBRARY_SEED_BRIEFS, LIBRARY_SEED_SUBSCRIPTIONS } from "@/lib/library/constants"
import type {
  LibraryBriefFeedbackRecord,
  LibraryBriefRecord,
  LibrarySubscriptionRecord,
} from "@/lib/library/types"

interface LibraryStore {
  subscriptions: LibrarySubscriptionRecord[]
  briefs: LibraryBriefRecord[]
  feedback: LibraryBriefFeedbackRecord[]
}

declare global {
  // eslint-disable-next-line no-var
  var __libraryStore: LibraryStore | undefined
}

function cloneStore(): LibraryStore {
  return {
    subscriptions: LIBRARY_SEED_SUBSCRIPTIONS.map((item) => ({ ...item, tags: [...item.tags] })),
    briefs: LIBRARY_SEED_BRIEFS.map((item) => ({
      ...item,
      tags: [...item.tags],
      keywords: [...item.keywords],
    })),
    feedback: [],
  }
}

export function getLibraryStore(): LibraryStore {
  if (!globalThis.__libraryStore) {
    globalThis.__libraryStore = cloneStore()
  }
  return globalThis.__libraryStore
}
