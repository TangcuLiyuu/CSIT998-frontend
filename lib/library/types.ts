export type SubscriptionStatus = "active" | "paused"
export type SubscriptionFrequency = "Daily" | "2x / week" | "Weekly" | "Monthly"
export type BriefFeedbackValue = "up" | "down" | null
export type LibraryResourceType =
  | "concept"
  | "method"
  | "mistake-analysis"
  | "exercise-guide"
  | "intervention"
  | "speaking-guide"
  | "article"
  | "paper"
export type LibraryTargetModule = "practice" | "solver" | "dashboard" | "speak" | "library"
export type LibraryAgeGroup = "kids" | "teens" | "general"
export type LibraryLanguage = "en" | "zh"

export interface LibrarySubscriptionRecord {
  id: string
  userId: string
  title: string
  intent: string
  frequency: SubscriptionFrequency
  status: SubscriptionStatus
  tags: string[]
  lastPushAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LibraryBriefRecord {
  id: string
  title: string
  summary: string
  resourceType: LibraryResourceType
  subject: string
  topic: string
  targetModule: LibraryTargetModule
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  ageGroup: LibraryAgeGroup
  language: LibraryLanguage
  tags: string[]
  readTime: string
  source: string
  sourceUrl: string
  imageUrl?: string
  createdAt: string
  keywords: string[]
  pdfUrl?: string
  originalTextPreview?: string
}

export interface LibraryBriefFeedbackRecord {
  id: string
  briefId: string
  userId: string
  value: Exclude<BriefFeedbackValue, null>
  createdAt: string
  updatedAt: string
}

export interface LibrarySubscription {
  id: string
  title: string
  intent: string
  frequency: SubscriptionFrequency
  status: SubscriptionStatus
  tags: string[]
  lastPush: string
}

export interface LibraryBrief {
  id: string
  title: string
  summary: string
  resourceType: LibraryResourceType
  subject: string
  topic: string
  targetModule: LibraryTargetModule
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  ageGroup: LibraryAgeGroup
  language: LibraryLanguage
  tags: string[]
  readTime: string
  source: string
  sourceUrl: string
  imageUrl?: string
  createdAt: string
  isRelevant?: boolean
  keywords?: string[]
  pdfUrl?: string
  originalTextPreview?: string
}

export interface QueryBriefsInput {
  keywords: string[]
  topic?: string
  targetModule?: LibraryTargetModule
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  ageGroup?: LibraryAgeGroup
  language?: LibraryLanguage
  limit?: number
}

export interface CreateSubscriptionInput {
  title?: string
  intent: string
  frequency?: SubscriptionFrequency
}

export interface UpdateSubscriptionInput {
  title?: string
  intent?: string
  frequency?: SubscriptionFrequency
  status?: SubscriptionStatus
}

export interface BatchSubscriptionInput {
  ids: string[]
  action: "pause" | "delete"
}
