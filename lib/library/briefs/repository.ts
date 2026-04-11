import { getLibraryStore } from "@/lib/library/db"
import type { LibraryBriefRecord } from "@/lib/library/types"

export async function listBriefs(): Promise<LibraryBriefRecord[]> {
  return getLibraryStore().briefs.map((item) => ({
    ...item,
    tags: [...item.tags],
    keywords: [...item.keywords],
  }))
}

export async function findBriefById(id: string): Promise<LibraryBriefRecord | null> {
  const item = getLibraryStore().briefs.find((brief) => brief.id === id)
  if (!item) {
    return null
  }
  return {
    ...item,
    tags: [...item.tags],
    keywords: [...item.keywords],
  }
}
