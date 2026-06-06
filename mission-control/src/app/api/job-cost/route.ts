import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";

const DATA_FILE = "state/job-cost-data.json";

export async function GET() {
  const data = await readJson(DATA_FILE, { jobs: [], actuals: [] });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await writeJson(DATA_FILE, body);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
