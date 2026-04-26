import type { LibrarySubscriptionRecord, SubscriptionFrequency } from "@/lib/library/types"

export const LIBRARY_DEFAULT_USER_ID = "demo-user"
export const LIBRARY_STORE_VERSION = "school-library-v3"
export const LIBRARY_DEFAULT_BRIEF_LIMIT = 50
export const LIBRARY_MAX_BRIEF_LIMIT = 100
export const LIBRARY_ALLOWED_FREQUENCIES: SubscriptionFrequency[] = [
  "Daily",
  "2x / week",
  "Weekly",
  "Monthly",
]

const now = "2026-04-06T08:00:00.000Z"

export const LIBRARY_SEED_SUBSCRIPTIONS: LibrarySubscriptionRecord[] = [
  {
    id: "sub-fractions",
    userId: LIBRARY_DEFAULT_USER_ID,
    title: "Fraction Skills",
    intent: "Practice fraction comparison, common denominators, and addition mistakes",
    frequency: "Daily",
    status: "active",
    tags: ["Fractions", "Math", "Common Denominators"],
    lastPushAt: "2026-04-06T05:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sub-geometry-measurement",
    userId: LIBRARY_DEFAULT_USER_ID,
    title: "Geometry and Measurement",
    intent: "Review perimeter, area, rectangles, and word problems",
    frequency: "2x / week",
    status: "active",
    tags: ["Geometry", "Perimeter", "Area"],
    lastPushAt: "2026-04-05T08:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sub-english-science",
    userId: LIBRARY_DEFAULT_USER_ID,
    title: "English and Science Support",
    intent: "Review past simple grammar and primary science observation topics",
    frequency: "Weekly",
    status: "paused",
    tags: ["English", "Science", "Past Simple"],
    lastPushAt: "2026-03-31T08:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
]
