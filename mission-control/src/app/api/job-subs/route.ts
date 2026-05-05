import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type JobSubsState = Record<string, string[]>;

const DATA_DIR = join(process.cwd(), "state");
const DATA_FILE = join(DATA_DIR, "job-subs.json");

async function readState(): Promise<JobSubsState> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as JobSubsState) : {};
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ subIds: [] as string[] });

  const state = await readState();
  return NextResponse.json({ subIds: Array.isArray(state[jobId]) ? state[jobId] : [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const subIds = Array.isArray(body?.subIds) ? body.subIds.filter((x: unknown) => typeof x === "string") : [];

    if (!jobId) return NextResponse.json({ ok: false }, { status: 400 });

    const state = await readState();
    state[jobId] = subIds;

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
