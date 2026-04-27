import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Try to resolve a filename to an actual file in DATA_DIR.
 * Priority:
 *   1. Exact match (original name)
 *   2. Same base name with .pdf extension (PDF preferred over DOCX)
 *   3. Same base name with .docx extension
 *   4. Fuzzy match (ignore _ vs space) — pdf first, then docx, then anything
 */
function resolveFilePath(filename: string): string | null {
  const safeName = path.basename(filename);
  const baseName = safeName.replace(/\.[^.]+$/, ""); // strip extension

  // Exact name variants first
  const exactVariants = [
    safeName,
    safeName.replace(/_/g, " "),
    safeName.replace(/ /g, "_"),
  ];

  // Extension-swapped variants (pdf priority)
  const extSwapped = [
    `${baseName}.pdf`,
    `${baseName}.docx`,
    baseName.replace(/_/g, " ") + ".pdf",
    baseName.replace(/_/g, " ") + ".docx",
    baseName.replace(/ /g, "_") + ".pdf",
    baseName.replace(/ /g, "_") + ".docx",
  ];

  for (const candidate of [...exactVariants, ...extSwapped]) {
    const filePath = path.join(DATA_DIR, candidate);
    if (!filePath.startsWith(DATA_DIR)) continue;
    if (fs.existsSync(filePath)) return filePath;
  }

  // Fuzzy match: normalize spaces/underscores, prefer pdf then docx
  try {
    const files = fs.readdirSync(DATA_DIR);
    const normalizedBase = baseName.replace(/[_ ]/g, "").toLowerCase();

    const sorted = [...files].sort((a, b) => {
      const order = (f: string) => {
        const e = path.extname(f).toLowerCase();
        return e === ".pdf" ? 0 : e === ".docx" ? 1 : 2;
      };
      return order(a) - order(b);
    });

    // Match by base name (ignore extension)
    const matchByBase = sorted.find(
      (f) => f.replace(/\.[^.]+$/, "").replace(/[_ ]/g, "").toLowerCase() === normalizedBase
    );
    if (matchByBase) {
      const filePath = path.join(DATA_DIR, matchByBase);
      if (filePath.startsWith(DATA_DIR)) return filePath;
    }

    // Full name fuzzy match (original behavior fallback)
    const normalizedFull = safeName.replace(/[_ ]/g, "").toLowerCase();
    const matchFull = sorted.find(
      (f) => f.replace(/[_ ]/g, "").toLowerCase() === normalizedFull
    );
    if (matchFull) {
      const filePath = path.join(DATA_DIR, matchFull);
      if (filePath.startsWith(DATA_DIR)) return filePath;
    }
  } catch {
    // ignore
  }

  return null;
}

// GET /api/documents?filename=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const filePath = resolveFilePath(filename);

  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") {
    contentType = "application/pdf";
  } else if (ext === ".docx") {
    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  const fileBuffer = fs.readFileSync(filePath);
  const actualName = path.basename(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(actualName)}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// POST /api/documents - list all available documents
export async function POST() {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ext === ".pdf" || ext === ".docx";
    });
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
