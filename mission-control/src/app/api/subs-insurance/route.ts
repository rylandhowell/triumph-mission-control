import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

const DATA_DIR = join(process.cwd(), "state");
const DATA_FILE = join(DATA_DIR, "subs-insurance.json");

export async function GET() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return NextResponse.json({ rows: JSON.parse(raw) as SubRecord[] });
  } catch {
    return NextResponse.json({ rows: [] as SubRecord[] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
