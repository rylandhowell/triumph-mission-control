import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  
  const data = await readJson(`state-sync/${key}.json`, null);
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, data } = body;
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
    
    await writeJson(`state-sync/${key}.json`, data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
