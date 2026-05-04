import { NextResponse } from "next/server";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type InsuranceType = "gl" | "wc";

async function extractPdfTextWithPdfJs(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const strings = tc.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(strings);
  }
  return pages.join("\n");
}

async function extractOcrText(buffer: ArrayBuffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "coi-ocr-"));
  try {
    const pdfPath = join(dir, "coi.pdf");
    await writeFile(pdfPath, Buffer.from(buffer));

    await execFileAsync("pdftoppm", ["-f", "1", "-l", "2", "-png", pdfPath, join(dir, "page")]);
    const files = (await readdir(dir)).filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();

    const chunks: string[] = [];
    for (const file of files) {
      const { stdout } = await execFileAsync("tesseract", [join(dir, file), "stdout", "--psm", "6", "-l", "eng"]);
      if (stdout?.trim()) chunks.push(stdout);
    }

    return chunks.join("\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function parseDateToken(token: string): Date | null {
  const parts = token.split(/[\/-]/).map((x) => Number(x));
  if (parts.length !== 3) return null;
  const [a, b, cRaw] = parts;
  let c = cRaw;
  if (c < 100) c += 2000;
  if (a > 12) {
    // dd/mm/yyyy fallback
    const d = new Date(c, b - 1, a);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(c, a - 1, b);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickExpiration(text: string, type: InsuranceType): string | null {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g;
  const now = new Date();
  const maxFuture = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

  const keywords =
    type === "gl"
      ? ["general liability", "commercial general liability", "cgl", "gen liab"]
      : ["workers compensation", "workers comp", "worker's compensation", "wc"]; 

  const candidates: Date[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (!keywords.some((k) => line.includes(k))) continue;

    const scope = [lines[i], lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ");
    const matches = scope.match(dateRegex) ?? [];
    for (const m of matches) {
      const dt = parseDateToken(m);
      if (dt && dt >= now && dt <= maxFuture) candidates.push(dt);
    }
  }

  if (!candidates.length) {
    const allMatches = normalized.match(dateRegex) ?? [];
    for (const m of allMatches) {
      const dt = parseDateToken(m);
      if (dt && dt >= now && dt <= maxFuture) candidates.push(dt);
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return isoDate(candidates[candidates.length - 1]);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const typeRaw = form.get("type");
    const type: InsuranceType = typeRaw === "wc" ? "wc" : "gl";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const ab = await file.arrayBuffer();

    let text = "";
    try {
      text = await extractPdfTextWithPdfJs(ab);
    } catch {
      // ignore
    }

    if (!text || text.trim().length < 30) {
      try {
        text = await extractOcrText(ab);
      } catch {
        // ignore
      }
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ found: false, error: "Could not read insurance file text" });
    }

    const expirationDate = pickExpiration(text, type);

    if (!expirationDate) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, expirationDate });
  } catch {
    return NextResponse.json({ error: "Failed to extract expiration" }, { status: 500 });
  }
}
