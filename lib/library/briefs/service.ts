import { LIBRARY_DEFAULT_BRIEF_LIMIT, LIBRARY_MAX_BRIEF_LIMIT } from "@/lib/library/constants"
import { listBriefs } from "@/lib/library/briefs/repository"
import { scoreBriefRelevance } from "@/lib/library/briefs/ranking"
import type { LibraryBrief, QueryBriefsInput } from "@/lib/library/types"

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return LIBRARY_DEFAULT_BRIEF_LIMIT
  }
  return Math.max(1, Math.min(limit, LIBRARY_MAX_BRIEF_LIMIT))
}

export async function queryBriefs(input: QueryBriefsInput): Promise<LibraryBrief[]> {
  const keywords = input.keywords ?? []
  const limit = clampLimit(input.limit)
  const briefs = await listBriefs()

  const ranked = briefs
    .map((brief) => ({
      brief,
      score: scoreBriefRelevance(brief, input),
    }))
    .filter(({ score }) => keywords.length === 0 ? score >= 0 : score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      return new Date(right.brief.createdAt).getTime() - new Date(left.brief.createdAt).getTime()
    })
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
    imageUrl: brief.imageUrl,
    createdAt: brief.createdAt,
    isRelevant: score > 0,
    keywords: brief.keywords,
    pdfUrl: brief.pdfUrl,
    originalTextPreview: brief.originalTextPreview,
  }))
}
