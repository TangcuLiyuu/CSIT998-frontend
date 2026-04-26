import { readFile } from "node:fs/promises"
import path from "node:path"
import type { LibraryBriefRecord } from "@/lib/library/types"

const RESOURCE_FILE = path.join(process.cwd(), "data", "library-resources.jsonl")

function copyBrief(item: LibraryBriefRecord): LibraryBriefRecord {
  return {
    ...item,
    tags: [...item.tags],
    keywords: [...item.keywords],
  }
}

export async function listBriefs(): Promise<LibraryBriefRecord[]> {
  const content = await readFile(RESOURCE_FILE, "utf8")
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => copyBrief(JSON.parse(line) as LibraryBriefRecord))
}

export async function findBriefById(id: string): Promise<LibraryBriefRecord | null> {
  const briefs = await listBriefs()
  return briefs.find((brief) => brief.id === id) || null
}
