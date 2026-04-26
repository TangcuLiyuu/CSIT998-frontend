import { LIBRARY_SEED_SUBSCRIPTIONS, LIBRARY_STORE_VERSION } from "@/lib/library/constants"
import type {
  LibraryBriefFeedbackRecord,
  LibrarySubscriptionRecord,
} from "@/lib/library/types"

interface LibraryStore {
  version: string
  subscriptions: LibrarySubscriptionRecord[]
  feedback: LibraryBriefFeedbackRecord[]
}

declare global {
  // eslint-disable-next-line no-var
  var __libraryStore: LibraryStore | undefined
}

function cloneStore(): LibraryStore {
  return {
    version: LIBRARY_STORE_VERSION,
    subscriptions: LIBRARY_SEED_SUBSCRIPTIONS.map((item) => ({ ...item, tags: [...item.tags] })),
    feedback: [],
  }
}

export function getLibraryStore(): LibraryStore {
  if (!globalThis.__libraryStore || globalThis.__libraryStore.version !== LIBRARY_STORE_VERSION) {
    globalThis.__libraryStore = cloneStore()
  }
  return globalThis.__libraryStore
}
