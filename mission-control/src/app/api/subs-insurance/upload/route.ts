import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads", "insurance");

export async function POST(req: Request) {
  try {
    console.log("[UPLOAD] Starting upload request");
    const form = await req.formData();
    const file = form.get("file");
    const type = form.get("type") === "wc" ? "wc" : "gl";
    console.log("[UPLOAD] File:", file instanceof File ? `${file.name} (${file.size} bytes)` : "Invalid file");

    if (!(file instanceof File) || file.size === 0) {
      console.error("[UPLOAD] Missing or empty file");
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      console.error("[UPLOAD] File too large:", file.size);
      return NextResponse.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 100MB)` }, { status: 413 });
    }

    // Accept any file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const id = randomUUID();
    const filename = `${id}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    console.log(`[UPLOAD] Filename: ${filename}, extension: ${ext}, path: ${filepath}`);

    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log("[UPLOAD] Dir created/available");

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    console.log(`[UPLOAD] File written: ${filepath}`);

    const url = `/uploads/insurance/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url,
      filename: file.name,
      type,
      message: `File "${file.name}" uploaded successfully` 
    });
  } catch (err) {
    console.error("[UPLOAD] Upload error:", err);
    console.error("[UPLOAD] Error stack:", (err as Error).stack);
    // If it's a body size error
    if ((err as Error).message?.includes('body')) {
      return NextResponse.json({ error: "File too large - max 100MB" }, { status: 413 });
    }
    return NextResponse.json({ error: (err as Error).message || "Upload failed" }, { status: 500 });
  }
}
