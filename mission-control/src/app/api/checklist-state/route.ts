import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type ChecklistState = Record<string, string[]>;

const DATA_DIR = join(process.cwd(), "state");
const DATA_FILE = join(DATA_DIR, "checklist-state.json");

async function readState(): Promise<ChecklistState> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ChecklistState) : {};
  } catch {
    return {};
  }
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

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
