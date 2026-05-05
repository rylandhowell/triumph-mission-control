import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";

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
  return NextResponse.json({ rows: Array.isArray(rows) ? rows : [] as SubRecord[] });
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
