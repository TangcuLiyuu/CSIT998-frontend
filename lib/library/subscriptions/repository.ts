import { getLibraryStore } from "@/lib/library/db"
import type { LibrarySubscriptionRecord, SubscriptionStatus } from "@/lib/library/types"

function copyRecord(item: LibrarySubscriptionRecord): LibrarySubscriptionRecord {
  return { ...item, tags: [...item.tags] }
}

export async function listSubscriptionsByUser(userId: string): Promise<LibrarySubscriptionRecord[]> {
  return getLibraryStore().subscriptions.filter((item) => item.userId === userId).map(copyRecord)
}

export async function findSubscriptionById(id: string, userId: string): Promise<LibrarySubscriptionRecord | null> {
  const item = getLibraryStore().subscriptions.find((subscription) => subscription.id === id && subscription.userId === userId)
  return item ? copyRecord(item) : null
}

export async function createSubscription(record: LibrarySubscriptionRecord): Promise<LibrarySubscriptionRecord> {
  getLibraryStore().subscriptions.unshift(record)
  return copyRecord(record)
}

export async function updateSubscription(
  id: string,
  userId: string,
  updates: Partial<Omit<LibrarySubscriptionRecord, "id" | "userId" | "createdAt">>,
): Promise<LibrarySubscriptionRecord | null> {
  const store = getLibraryStore()
  const index = store.subscriptions.findIndex((subscription) => subscription.id === id && subscription.userId === userId)
  if (index === -1) {
    return null
  }

  const next = {
    ...store.subscriptions[index],
    ...updates,
    tags: updates.tags ? [...updates.tags] : [...store.subscriptions[index].tags],
  }
  store.subscriptions[index] = next
  return copyRecord(next)
}

export async function deleteSubscription(id: string, userId: string): Promise<boolean> {
  const store = getLibraryStore()
  const initialLength = store.subscriptions.length
  store.subscriptions = store.subscriptions.filter((subscription) => !(subscription.id === id && subscription.userId === userId))
  return store.subscriptions.length !== initialLength
}

export async function applyBatchSubscriptionAction(
  ids: string[],
  userId: string,
  action: "pause" | "delete",
): Promise<LibrarySubscriptionRecord[]> {
  const store = getLibraryStore()
  const targetIds = new Set(ids)

  if (action === "delete") {
    store.subscriptions = store.subscriptions.filter(
      (subscription) => !(subscription.userId === userId && targetIds.has(subscription.id)),
    )
  } else {
    store.subscriptions = store.subscriptions.map((subscription) =>
      subscription.userId === userId && targetIds.has(subscription.id)
        ? { ...subscription, status: "paused" satisfies SubscriptionStatus, updatedAt: new Date().toISOString() }
        : subscription,
    )
  }

  return store.subscriptions.filter((subscription) => subscription.userId === userId).map(copyRecord)
}
