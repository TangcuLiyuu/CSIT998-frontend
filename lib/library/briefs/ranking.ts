import type { LibraryAgeGroup, LibraryBriefRecord, LibraryLanguage, LibraryTargetModule } from "@/lib/library/types"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
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
  const sourceQualityScore = [
    "Khan Academy",
    "Math is Fun",
    "NRICH",
    "BBC Bitesize",
    "British Council LearnEnglish Kids",
    "Cambridge English",
    "National Geographic Kids",
    "The Pique Lab",
  ].includes(brief.source)
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

export function explainBriefRelevance(brief: LibraryBriefRecord, input: RelevanceInput) {
  const reasons: string[] = []
  const normalizedKeywords = input.keywords.map(normalize).filter(Boolean)
  const keywordMatches = normalizedKeywords.filter((keyword) =>
    [
      brief.title,
      brief.summary,
      brief.source,
      ...brief.tags,
      ...brief.keywords,
    ].some((value) => normalize(value).includes(keyword)),
  )

  if (keywordMatches.length > 0) {
    reasons.push(`Matches ${uniqueValues(keywordMatches).slice(0, 3).join(", ")}`)
  }
  if (input.topic && normalize(brief.topic).includes(normalize(input.topic))) {
    reasons.push(`Topic aligns with ${brief.topic}`)
  }
  if (input.targetModule && brief.targetModule === input.targetModule) {
    reasons.push(`Built for the ${brief.targetModule} module`)
  }
  if (input.difficulty && compareDifficulty(brief.difficulty, input.difficulty) > 0) {
    reasons.push(`Difficulty fits ${input.difficulty} learners`)
  }
  if (input.ageGroup && brief.ageGroup === input.ageGroup) {
    reasons.push(`Recommended for ${brief.ageGroup}`)
  }
  if (input.language && brief.language === input.language) {
    reasons.push(`Available in ${brief.language.toUpperCase()}`)
  }

  if (reasons.length === 0) {
    reasons.push("Included as a high-quality seed resource for exploration")
  }

  return reasons.slice(0, 4)
}
