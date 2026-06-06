import { NextResponse } from "next/server";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
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

async function extractOcrText(buffer: ArrayBuffer, originalName = "upload.pdf"): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "coi-ocr-"));
  try {
    const ext = extname(originalName).toLowerCase();
    const isPdf = ext === ".pdf" || !ext;

    if (isPdf) {
      const pdfPath = join(dir, "coi.pdf");
      await writeFile(pdfPath, Buffer.from(buffer));
      await execFileAsync("pdftoppm", ["-f", "1", "-l", "3", "-png", pdfPath, join(dir, "page")]);

      const files = (await readdir(dir)).filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();
      const chunks: string[] = [];
      for (const file of files) {
        const { stdout } = await execFileAsync("tesseract", [join(dir, file), "stdout", "--psm", "6", "-l", "eng"]);
        if (stdout?.trim()) chunks.push(stdout);
      }
      return chunks.join("\n");
    }

    const imagePath = join(dir, `coi${ext || ".png"}`);
    await writeFile(imagePath, Buffer.from(buffer));
    const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", "--psm", "6", "-l", "eng"]);
    return stdout || "";
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function parseDateToken(token: string): Date | null {
  const cleaned = token.trim();

  const monthName = cleaned.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})\b/i);
  if (monthName) {
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
    };
    const m = monthMap[monthName[1].toLowerCase()];
    const day = Number(monthName[2]);
    let year = Number(monthName[3]);
    if (year < 100) year += 2000;
    const d = new Date(year, m, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parts = cleaned.split(/[\/-]/).map((x) => Number(x));
  if (parts.length !== 3) return null;
  const [a, b, cRaw] = parts;
  let c = cRaw;
  if (c < 100) c += 2000;
  if (a > 12) {
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
  const dateRegex = /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/gi;
  const minDate = new Date(2000, 0, 1);
  const maxDate = new Date(2100, 11, 31);

  const sectionKeywords =
    type === "gl"
      ? ["general liability", "commercial general liability", "cgl", "gen liab"]
      : ["workers compensation", "workers comp", "worker's compensation", "wc"];

  const expKeywords = ["exp", "expire", "expiration", "exp date", "expir"];

  const scored: Array<{ dt: Date; score: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const scope = [lines[i - 1] ?? "", lines[i], lines[i + 1] ?? "", lines[i + 2] ?? ""].join(" ").toLowerCase();

    const sectionHit = sectionKeywords.some((k) => scope.includes(k));
    const expHit = expKeywords.some((k) => scope.includes(k));

    const matchesA: string[] = lines[i].match(dateRegex) ?? [];
    const matchesB: string[] = (lines[i + 1] ?? "").match(dateRegex) ?? [];
    const matches: string[] = [...matchesA, ...matchesB];
    for (const m of matches) {
      const dt = parseDateToken(m);
      if (!dt || dt < minDate || dt > maxDate) continue;
      let score = 1;
      if (sectionHit) score += 3;
      if (expHit) score += 3;
      scored.push({ dt, score });
    }
  }

  if (!scored.length) {
    const allMatches = normalized.match(dateRegex) ?? [];
    for (const m of allMatches) {
      const dt = parseDateToken(m);
      if (dt && dt >= minDate && dt <= maxDate) scored.push({ dt, score: 1 });
    }
  }

  if (!scored.length) return null;

  scored.sort((a, b) => (b.score - a.score) || (b.dt.getTime() - a.dt.getTime()));
  return isoDate(scored[0].dt);
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
    const fileName = file.name || "upload.pdf";
    const isPdf = fileName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      try {
        text = await extractPdfTextWithPdfJs(ab);
      } catch {
        // ignore
      }
    }

    if (!text || text.trim().length < 30) {
      try {
        text = await extractOcrText(ab, fileName);
      } catch {
        // ignore
      }
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ found: false, error: "Could not read text from PDF. Try a clearer scan or image file." });
    }

    const expirationDate = pickExpiration(text, type);

    if (!expirationDate) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, expirationDate });
  } catch {
    return NextResponse.json({ error: "Failed to extract expiration" }, { status: 500 });
  }
}
