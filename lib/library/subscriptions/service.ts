import {
  LIBRARY_ALLOWED_FREQUENCIES,
  LIBRARY_DEFAULT_USER_ID,
} from "@/lib/library/constants"
import {
  applyBatchSubscriptionAction,
  createSubscription,
  deleteSubscription,
  listSubscriptionsByUser,
  updateSubscription,
} from "@/lib/library/subscriptions/repository"
import type {
  BatchSubscriptionInput,
  CreateSubscriptionInput,
  LibrarySubscription,
  LibrarySubscriptionRecord,
  SubscriptionStatus,
  SubscriptionFrequency,
  UpdateSubscriptionInput,
} from "@/lib/library/types"

function isAllowedFrequency(value: string): value is SubscriptionFrequency {
  return LIBRARY_ALLOWED_FREQUENCIES.includes(value as SubscriptionFrequency)
}

function formatRelativeLastPush(value: string | null) {
  if (!value) {
    return "Just now"
  }
  const diffMs = Date.now() - new Date(value).getTime()
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))
  const days = Math.floor(hours / 24)

  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

function deriveTags(input: string) {
  const words = input
    .split(/[\s,./-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4)

  const unique = Array.from(new Set(words)).slice(0, 3)
  return unique.length > 0 ? unique : ["Custom"]
}

function toPublicSubscription(record: LibrarySubscriptionRecord): LibrarySubscription {
  return {
    id: record.id,
    title: record.title,
    intent: record.intent,
    frequency: record.frequency,
    status: record.status,
    tags: record.tags,
    lastPush: formatRelativeLastPush(record.lastPushAt),
  }
}

function ensureUserId(userId?: string) {
  return userId || LIBRARY_DEFAULT_USER_ID
}

export async function getSubscriptions(userId?: string) {
  const records = await listSubscriptionsByUser(ensureUserId(userId))
  return records.map(toPublicSubscription)
}

export async function createLibrarySubscription(input: CreateSubscriptionInput, userId?: string) {
  const intent = input.intent.trim()
  if (!intent) {
    throw new Error("Intent is required.")
  }

  const frequency = input.frequency && isAllowedFrequency(input.frequency) ? input.frequency : "Weekly"
  const title = input.title?.trim() || (intent.length > 44 ? `${intent.slice(0, 41).trim()}...` : intent)
  const now = new Date().toISOString()

  const record: LibrarySubscriptionRecord = {
    id: `sub-${crypto.randomUUID()}`,
    userId: ensureUserId(userId),
    title,
    intent,
    frequency,
    status: "active",
    tags: deriveTags(intent),
    lastPushAt: now,
    createdAt: now,
    updatedAt: now,
  }

  return toPublicSubscription(await createSubscription(record))
}

export async function updateLibrarySubscription(id: string, input: UpdateSubscriptionInput, userId?: string) {
  const updates: Partial<Omit<LibrarySubscriptionRecord, "id" | "userId" | "createdAt">> = {
    updatedAt: new Date().toISOString(),
  }

  if (input.title !== undefined) {
    updates.title = input.title.trim()
  }
  if (input.intent !== undefined) {
    updates.intent = input.intent.trim()
    updates.tags = deriveTags(input.intent)
  }
  if (input.frequency !== undefined) {
    if (!isAllowedFrequency(input.frequency)) {
      throw new Error("Invalid frequency.")
    }
    updates.frequency = input.frequency
  }
  if (input.status !== undefined) {
    const nextStatus: SubscriptionStatus = input.status === "paused" ? "paused" : "active"
    updates.status = nextStatus
  }

  const updated = await updateSubscription(id, ensureUserId(userId), updates)
  if (!updated) {
    throw new Error("Subscription not found.")
  }
  return toPublicSubscription(updated)
}

export async function removeLibrarySubscription(id: string, userId?: string) {
  const deleted = await deleteSubscription(id, ensureUserId(userId))
  if (!deleted) {
    throw new Error("Subscription not found.")
  }
  return { success: true }
}

export async function applySubscriptionBatch(input: BatchSubscriptionInput, userId?: string) {
  if (!Array.isArray(input.ids) || input.ids.length === 0) {
    throw new Error("At least one subscription id is required.")
  }
  if (input.action !== "pause" && input.action !== "delete") {
    throw new Error("Invalid batch action.")
  }
  const records = await applyBatchSubscriptionAction(input.ids, ensureUserId(userId), input.action)
  return { items: records.map(toPublicSubscription) }
}
