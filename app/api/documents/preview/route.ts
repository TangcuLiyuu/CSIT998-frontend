import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Given a filename (possibly with any extension), resolve the actual file path
 * in DATA_DIR. Priority:
 *   1. Exact match (original name)
 *   2. Same base name but with .pdf extension
 *   3. Same base name but with .docx extension
 *   4. Fuzzy match (ignore _ vs space) — pdf first, then docx, then anything
 */
function resolveFilePath(filename: string): string | null {
  const safeName = path.basename(filename);
  const baseName = safeName.replace(/\.[^.]+$/, ""); // strip extension

  // Build candidate list: exact name variants first, then pdf/docx swaps
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

  const candidates = [...exactVariants, ...extSwapped];

  for (const candidate of candidates) {
    const filePath = path.join(DATA_DIR, candidate);
    if (!filePath.startsWith(DATA_DIR)) continue;
    if (fs.existsSync(filePath)) return filePath;
  }

  // Fuzzy match: normalize spaces/underscores and compare base names
  // Prefer pdf, then docx, then anything else
  try {
    const files = fs.readdirSync(DATA_DIR);
    const normalizedInputBase = baseName.replace(/[_ ]/g, "").toLowerCase();

    // Sort so .pdf comes before .docx comes before others
    const sorted = [...files].sort((a, b) => {
      const extA = path.extname(a).toLowerCase();
      const extB = path.extname(b).toLowerCase();
      const order = (ext: string) =>
        ext === ".pdf" ? 0 : ext === ".docx" ? 1 : 2;
      return order(extA) - order(extB);
    });

    // First try: match by base name (ignore extension)
    const matchByBase = sorted.find((f) => {
      const fBase = f.replace(/\.[^.]+$/, "");
      return fBase.replace(/[_ ]/g, "").toLowerCase() === normalizedInputBase;
    });
    if (matchByBase) {
      const filePath = path.join(DATA_DIR, matchByBase);
      if (filePath.startsWith(DATA_DIR)) return filePath;
    }

    // Second try: full name match (original behavior)
    const normalizedInputFull = safeName.replace(/[_ ]/g, "").toLowerCase();
    const matchFull = sorted.find(
      (f) => f.replace(/[_ ]/g, "").toLowerCase() === normalizedInputFull
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

// GET /api/documents/preview?filename=xxx
// Returns HTML string for DOCX files, or PDF bytes for PDF files.
// Response header X-File-Type indicates the actual type: "pdf" | "docx"
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

  const actualName = path.basename(filePath);
  console.log(`[preview] requested="${filename}" resolved="${actualName}"`);

  if (ext === ".pdf") {
    try {
      const buffer = fs.readFileSync(filePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Cache-Control": "no-store",
          "X-File-Type": "pdf",
          "X-Resolved-Filename": encodeURIComponent(actualName),
        },
      });
    } catch (err) {
      console.error("PDF read error:", err);
      return NextResponse.json({ error: "Failed to read PDF" }, { status: 500 });
    }
  }

  if (ext === ".docx") {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value;

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-File-Type": "docx",
          "X-Resolved-Filename": encodeURIComponent(actualName),
        },
      });
    } catch (err) {
      console.error("mammoth conversion error:", err);
      return NextResponse.json({ error: "Failed to convert document" }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Unsupported file type: " + ext },
    { status: 400 }
  );
}
