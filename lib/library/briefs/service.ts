import { LIBRARY_DEFAULT_BRIEF_LIMIT, LIBRARY_MAX_BRIEF_LIMIT } from "@/lib/library/constants"
import { listBriefs } from "@/lib/library/briefs/repository"
import { explainBriefRelevance, scoreBriefAgainstKeywords, scoreBriefRelevance } from "@/lib/library/briefs/ranking"
import type { LibraryBrief, QueryBriefsInput } from "@/lib/library/types"

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return LIBRARY_DEFAULT_BRIEF_LIMIT
  }
  return Math.max(1, Math.min(limit, LIBRARY_MAX_BRIEF_LIMIT))
}

function toDemoMatchScore(score: number) {
  if (score <= 0) {
    return 35
  }
  return Math.min(98, Math.round(58 + score * 9))
}

function hashSeed(value: string) {
  return value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function shuffleWithSeed<T>(items: T[], seed: string) {
  const next = [...items]
  const random = seededRandom(seed)
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

export async function queryBriefs(input: QueryBriefsInput): Promise<LibraryBrief[]> {
  const keywords = input.keywords ?? []
  const limit = clampLimit(input.limit)
  const briefs = await listBriefs()

  const scored = briefs
    .map((brief) => ({
      brief,
      keywordScore: scoreBriefAgainstKeywords(brief, keywords),
      score: scoreBriefRelevance(brief, input),
    }))
    .filter(({ brief, keywordScore }) => {
      if (keywords.length === 0) {
        return true
      }
      const topicMatches = input.topic && brief.topic.toLowerCase().includes(input.topic.toLowerCase())
      const moduleMatches = input.targetModule && brief.targetModule === input.targetModule
      return keywordScore > 0 || Boolean(topicMatches) || Boolean(moduleMatches)
    })

  const ordered = input.shuffleSeed
    ? shuffleWithSeed(scored, input.shuffleSeed)
    : scored.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      return new Date(right.brief.createdAt).getTime() - new Date(left.brief.createdAt).getTime()
    })

  const ranked = ordered
    .slice(0, limit)

  return ranked.map(({ brief, score }) => ({
    id: brief.id,
    title: brief.title,
    summary: brief.summary,
    resourceType: brief.resourceType,
    subject: brief.subject,
    topic: brief.topic,
    targetModule: brief.targetModule,
    difficulty: brief.difficulty,
    ageGroup: brief.ageGroup,
    language: brief.language,
    tags: brief.tags,
    readTime: brief.readTime,
    source: brief.source,
    sourceUrl: brief.sourceUrl,
    createdAt: brief.createdAt,
    isRelevant: score > 0,
    matchScore: toDemoMatchScore(score),
    matchReasons: explainBriefRelevance(brief, input),
    keywords: brief.keywords,
    pdfUrl: brief.pdfUrl,
    originalTextPreview: brief.originalTextPreview,
  }))
}
