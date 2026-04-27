import type { LibraryAgeGroup, LibraryBriefRecord, LibraryLanguage, LibraryTargetModule } from "@/lib/library/types"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function scoreBriefAgainstKeywords(brief: LibraryBriefRecord, keywords: string[]) {
  const normalizedKeywords = keywords.map(normalize).filter(Boolean)
  if (normalizedKeywords.length === 0) {
    return 0
  }

  const haystacks = [
    brief.title.toLowerCase(),
    brief.summary.toLowerCase(),
    brief.source.toLowerCase(),
    ...brief.tags.map((tag) => tag.toLowerCase()),
    ...brief.keywords.map((keyword) => keyword.toLowerCase()),
  ]

  return normalizedKeywords.reduce((score, keyword) => {
    if (haystacks.some((value) => value.includes(keyword))) {
      return score + 1
    }
    return score
  }, 0)
}

function compareDifficulty(
  briefDifficulty: LibraryBriefRecord["difficulty"],
  requestedDifficulty?: LibraryBriefRecord["difficulty"],
) {
  if (!requestedDifficulty) {
    return 0
  }
  if (briefDifficulty === requestedDifficulty) {
    return 1
  }
  if (
    (briefDifficulty === "Beginner" && requestedDifficulty === "Intermediate") ||
    (briefDifficulty === "Intermediate" && requestedDifficulty === "Beginner") ||
    (briefDifficulty === "Intermediate" && requestedDifficulty === "Advanced") ||
    (briefDifficulty === "Advanced" && requestedDifficulty === "Intermediate")
  ) {
    return 0.5
  }
  return 0
}

interface RelevanceInput {
  keywords: string[]
  topic?: string
  targetModule?: LibraryTargetModule
  difficulty?: LibraryBriefRecord["difficulty"]
  ageGroup?: LibraryAgeGroup
  language?: LibraryLanguage
}

export function scoreBriefRelevance(brief: LibraryBriefRecord, input: RelevanceInput) {
  const keywordScore = scoreBriefAgainstKeywords(brief, input.keywords)
  const topicScore = input.topic && brief.topic.toLowerCase().includes(input.topic.toLowerCase()) ? 1 : 0
  const moduleScore = input.targetModule && brief.targetModule === input.targetModule ? 1 : 0
  const difficultyScore = compareDifficulty(brief.difficulty, input.difficulty)
  const ageGroupScore = input.ageGroup && brief.ageGroup === input.ageGroup ? 1 : 0
  const languageScore = input.language && brief.language === input.language ? 1 : 0
  const sourceQualityScore = ["Learning Notes", "Solver Coach", "Intervention Brief", "Speaking Coach", "ArXiv"].includes(
    brief.source,
  )
    ? 1
    : 0.5

  return (
    keywordScore * 0.4 +
    topicScore * 3 +
    moduleScore * 2 +
    difficultyScore * 1.5 +
    ageGroupScore * 1 +
    languageScore * 0.5 +
    sourceQualityScore * 0.5
  )
}
