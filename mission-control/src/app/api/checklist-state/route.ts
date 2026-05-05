import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";

type ChecklistState = Record<string, string[]>;
const DATA_FILE = "state/checklist-state.json";

async function readState(): Promise<ChecklistState> {
  const parsed = await readJson<ChecklistState>(DATA_FILE, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ checked: [] as string[] });

  const state = await readState();
  return NextResponse.json({ checked: Array.isArray(state[jobId]) ? state[jobId] : [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const checked = Array.isArray(body?.checked) ? body.checked.filter((x: unknown) => typeof x === "string") : [];

    if (!jobId) return NextResponse.json({ ok: false }, { status: 400 });

    const state = await readState();
    state[jobId] = checked;

    await writeJson(DATA_FILE, state);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
