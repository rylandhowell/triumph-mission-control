import { NextResponse } from "next/server";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type Confidence = "low" | "medium" | "high";

const numberFrom = (value: string) => Number(value.replace(/,/g, ""));

const toSqft = (value: number, unit?: string) => {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u.includes("ft2") || u.includes("sqft") || u.includes("sf") || u.includes("sq ft")) return value;
  if (u.includes("in2") || u.includes("sqin") || u.includes("sq in")) return value / 144;
  return value;
};

async function extractPdfTextWithPdfJs(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const strings = tc.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(`\n[page ${i}]\n${strings}`);
  }

  return pages.join("\n");
}

async function extractPdfTextWithOcr(buffer: ArrayBuffer, maxPages = 3): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "plan-ocr-"));
  try {
    const pdfPath = join(dir, "plan.pdf");
    await writeFile(pdfPath, Buffer.from(buffer));

    // Render first pages to images for OCR (keeps runtime reasonable).
    const prefix = join(dir, "page");
    await execFileAsync("pdftoppm", ["-f", "1", "-l", String(maxPages), "-png", pdfPath, prefix]);

    const files = (await readdir(dir)).filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();
    const texts: string[] = [];

    for (const file of files) {
      const imagePath = join(dir, file);
      const { stdout } = await execFileAsync("tesseract", [imagePath, "stdout", "--psm", "6", "-l", "eng"]);
      if (stdout?.trim()) texts.push(stdout);
    }

    return texts.join("\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function extractLoosePdfText(buffer: ArrayBuffer): string {
  const raw = Buffer.from(buffer).toString("latin1");
  const matches = raw.match(/\(([^\)]{1,200})\)\s*TJ?|\[(.*?)\]\s*TJ/gim) ?? [];
  const chunks: string[] = [];

  for (const m of matches) {
    const literals = [...m.matchAll(/\(([^\)]{1,200})\)/g)].map((x) => x[1]);
    if (literals.length) chunks.push(literals.join(" "));
  }

  return `${chunks.join("\n")}\n${raw}`;
}

function parseWindowDoorSchedules(normalized: string) {
  // Prefer explicit quantity lines when schedules are readable.
  const qtyRegex = /\b([wd])\s*[-.]\s*([0-9a-z]{1,4})\b[^\n\r]{0,140}?\b(?:qty|quantity|count)\b[^0-9]{0,8}(\d{1,3})/gi;
  const qtyHits: Array<{ kind: "w" | "d"; tag: string; qty: number }> = [];
  for (const m of normalized.matchAll(qtyRegex)) {
    const kind = m[1].toLowerCase() === "w" ? "w" : "d";
    qtyHits.push({ kind, tag: `${kind}-${m[2].toLowerCase()}`, qty: numberFrom(m[3]) });
  }

  if (qtyHits.length) {
    // Deduplicate repeated schedule rows across pages by keeping max qty per tag.
    const winByTag = new Map<string, number>();
    const doorByTag = new Map<string, number>();
    for (const row of qtyHits) {
      if (row.kind === "w") winByTag.set(row.tag, Math.max(row.qty, winByTag.get(row.tag) ?? 0));
      else doorByTag.set(row.tag, Math.max(row.qty, doorByTag.get(row.tag) ?? 0));
    }
    const windowQty = [...winByTag.values()].reduce((sum, qty) => sum + qty, 0);
    const doorQty = [...doorByTag.values()].reduce((sum, qty) => sum + qty, 0);
    return {
      windowDoorCount: windowQty + doorQty,
      source: "schedule_qty" as const,
    };
  }

  // Fallback: unique tags across the set.
  const windowTags = new Set((normalized.match(/\bw\s*[-.]\s*[0-9a-z]{1,4}\b/g) ?? []).map((t) => t.replace(/\s+/g, "")));
  const doorTags = new Set((normalized.match(/\bd\s*[-.]\s*[0-9a-z]{1,4}\b/g) ?? []).map((t) => t.replace(/\s+/g, "")));

  return {
    // Fallback is conservative estimate by unique types, not repeated mentions.
    windowDoorCount: windowTags.size + doorTags.size,
    source: "unique_types_fallback" as const,
  };
}

function pickTakeoff(text: string, heatedSqft?: number | null, underRoofSqft?: number | null) {
  const normalized = text.replace(/\s+/g, " ").toLowerCase();

  const wallPatterns = [
    /wall\s*height[^0-9]{0,25}(\d{1,2})(?:\s*[-']\s*(\d{1,2}))?/i,
    /(?:ceiling|clg)\s*(?:height)?[^0-9]{0,15}(\d{1,2})\s*['’](?:\s*[-]?\s*(\d{1,2}))?/i,
    /(\d{1,2})\s*['’]\s*[-]?\s*(\d{1,2})?\s*(?:"|in)?\s*(?:plate|wall|clg|ceiling)/i,
  ];

  let wallHeightFt: number | null = null;
  for (const pattern of wallPatterns) {
    const m = normalized.match(pattern);
    if (m) {
      const ft = numberFrom(m[1]);
      const inches = m[2] ? numberFrom(m[2]) : 0;
      wallHeightFt = Number((ft + inches / 12).toFixed(2));
      break;
    }
  }

  const areaPatterns = [
    { key: "drywall", re: /(?:drywall|gyp(?:sum)?\s*board|sheetrock|interior\s*wall\s*area|gyp\s*area)[^0-9]{0,35}(\d{3,7}(?:\.\d+)?)\s*(sf|sq\.?\s*ft|sqft|ft2|sq\.?\s*in|in2)?/gi },
    { key: "brick", re: /(?:brick|masonry|veneer|exterior\s*wall\s*area|veneer\s*area)[^0-9]{0,35}(\d{3,7}(?:\.\d+)?)\s*(sf|sq\.?\s*ft|sqft|ft2|sq\.?\s*in|in2)?/gi },
  ] as const;

  const drywallVals: number[] = [];
  const brickVals: number[] = [];

  for (const p of areaPatterns) {
    const vals = p.key === "drywall" ? drywallVals : brickVals;
    for (const m of normalized.matchAll(p.re)) {
      const raw = numberFrom(m[1]);
      const sqft = toSqft(raw, m[2]);
      if (sqft > 100 && sqft < 200000) vals.push(sqft);
    }
  }

  const pickArea = (values: number[], kind: "drywall" | "brick") => {
    if (!values.length) return null;
    const ref = (kind === "drywall" ? heatedSqft : underRoofSqft) ?? null;
    if (!ref || ref <= 0) return Math.round(Math.max(...values));

    const min = kind === "drywall" ? ref * 1.2 : ref * 0.2;
    const max = kind === "drywall" ? ref * 8 : ref * 1.6;
    const filtered = values.filter((v) => v >= min && v <= max);
    const source = filtered.length ? filtered : values;
    return Math.round(Math.max(...source));
  };

  const drywallSqft = pickArea(drywallVals, "drywall");
  let brickSqft = pickArea(brickVals, "brick");

  const schedule = parseWindowDoorSchedules(normalized);
  const windowDoorCount = schedule.windowDoorCount;

  const likelyWindowsDoors =
    (heatedSqft && heatedSqft > 0 && windowDoorCount >= 8 && windowDoorCount <= Math.max(120, Math.round(heatedSqft / 18))) ||
    (!heatedSqft && windowDoorCount >= 8 && windowDoorCount <= 120);

  // Fallback guardrail for suspiciously low brick takeoff.
  // Uses a conservative proxy when plans do not expose a reliable total veneer area.
  let brickSource: "detected" | "fallback" = "detected";
  if (underRoofSqft && underRoofSqft > 0) {
    const fallbackBrickSqft = Math.round(underRoofSqft * 0.7);
    const suspiciouslyLow = !brickSqft || brickSqft < underRoofSqft * 0.35;
    if (suspiciouslyLow) {
      brickSqft = fallbackBrickSqft;
      brickSource = "fallback";
    }
  }

  const hitCount = [wallHeightFt, drywallSqft, brickSqft].filter(Boolean).length + (likelyWindowsDoors ? 1 : 0);

  let confidence: Confidence = "low";
  if (hitCount >= 4) confidence = "high";
  else if (hitCount >= 2) confidence = "medium";

  return {
    wallHeightFt,
    drywallSqft,
    brickSqft,
    brickSource,
    windowDoorCount: windowDoorCount > 0 ? windowDoorCount : null,
    ceilingAdjustmentPct: 0,
    confidence,
    extraction: {
      windowDoorSource: schedule.source,
      usedBrickFallback: brickSource === "fallback",
    },
    message:
      confidence === "high"
        ? "Pulled quantities from plan text. Review and confirm before issuing quote."
        : confidence === "medium"
          ? `Partial takeoff pulled from plan text (${schedule.source}). ${brickSource === "fallback" ? "Brick used conservative fallback." : ""} Fill missing fields manually.`
          : "Could not confidently read enough plan callouts. Enter takeoff fields manually.",
  };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    const heatedSqftRaw = form.get("heatedSqft");
    const underRoofSqftRaw = form.get("underRoofSqft");

    const heatedSqft = typeof heatedSqftRaw === "string" ? Number(heatedSqftRaw) : null;
    const underRoofSqft = typeof underRoofSqftRaw === "string" ? Number(underRoofSqftRaw) : null;

    if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const textParts: string[] = [];

    for (const file of files) {
      const ab = await file.arrayBuffer();
      let primaryText = "";
      try {
        primaryText = await extractPdfTextWithPdfJs(ab);
      } catch {
        primaryText = extractLoosePdfText(ab);
      }
      textParts.push(primaryText);

      const normalizedPrimary = primaryText.replace(/\s+/g, " ").toLowerCase();
      const hasUsefulTakeoffSignals =
        /wall\s*height|drywall|sheetrock|gyp|brick|masonry|veneer/.test(normalizedPrimary) &&
        /\b(w|d)\s*[-.]\s*[0-9a-z]{1,4}\b|qty|quantity|count/.test(normalizedPrimary);

      // OCR fallback only when primary extraction does not appear usable.
      if (!hasUsefulTakeoffSignals) {
        try {
          const ocrText = await extractPdfTextWithOcr(ab, 3);
          if (ocrText.trim().length > 50) {
            textParts.push(`\n[ocr]\n${ocrText}`);
          }
        } catch {
          // OCR tools not available or OCR failed; keep non-OCR extraction.
        }
      }
    }

    const merged = textParts.join("\n");
    const result = pickTakeoff(merged, heatedSqft, underRoofSqft);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to process plan files" }, { status: 500 });
  }
}
