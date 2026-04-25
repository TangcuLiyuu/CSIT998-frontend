import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const VCR_DIR = path.join(process.cwd(), "data", "vcr-tapes");

/**
 * Sanitize the cache key to produce a safe filename.
 * Replaces non-alphanumeric/CJK chars with underscores.
 */
function safeFileName(key: string): string {
  return key.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_").slice(0, 120);
}

async function ensureDir() {
  await fs.mkdir(VCR_DIR, { recursive: true });
}

/**
 * GET /api/vcr?key=<cacheKey>
 * Returns the tape JSON if it exists, or 404.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  const filePath = path.join(VCR_DIR, `${safeFileName(key)}.json`);

  try {
    await ensureDir();
    const content = await fs.readFile(filePath, "utf-8");
    const tape = JSON.parse(content);

    // Validate that the tape is a non-empty array
    if (!Array.isArray(tape) || tape.length === 0) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true, tape });
  } catch {
    return NextResponse.json({ exists: false }, { status: 404 });
  }
}

/**
 * POST /api/vcr
 * Body: { key: string, tape: VcrFrame[] }
 * Writes the tape to disk.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, tape } = body;

    if (!key || !Array.isArray(tape)) {
      return NextResponse.json(
        { error: "Invalid body: need key (string) and tape (array)" },
        { status: 400 }
      );
    }

    await ensureDir();
    const filePath = path.join(VCR_DIR, `${safeFileName(key)}.json`);
    await fs.writeFile(filePath, JSON.stringify(tape, null, 2), "utf-8");

    return NextResponse.json({ success: true, frames: tape.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/vcr?key=<cacheKey>
 * Deletes a specific tape, or all tapes if key=__all__.
 */
export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  try {
    await ensureDir();

    if (key === "__all__") {
      const files = await fs.readdir(VCR_DIR);
      for (const f of files) {
        if (f.endsWith(".json")) {
          await fs.unlink(path.join(VCR_DIR, f));
        }
      }
      return NextResponse.json({ success: true, deleted: files.length });
    }

    const filePath = path.join(VCR_DIR, `${safeFileName(key)}.json`);
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true, note: "File did not exist" });
  }
}
