import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";
import fs from "node:fs/promises";
import path from "node:path";

type SubRecord = {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  glPolicy: string;
  glExpires: string;
  wcPolicy: string;
  wcExpires: string;
  notes: string;
};

const DATA_FILE = "state/subs-insurance.json";

export async function GET() {
  const rows = await readJson<SubRecord[]>(DATA_FILE, []);
  if (Array.isArray(rows) && rows.length) return NextResponse.json({ rows });

  try {
    const localPath = path.join(process.cwd(), "state", "subs-insurance.json");
    const raw = await fs.readFile(localPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return NextResponse.json({ rows: parsed as SubRecord[] });
  } catch {
    // ignore
  }

  return NextResponse.json({ rows: [] as SubRecord[] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    await writeJson(DATA_FILE, rows);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
