import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";
import { recoveryJobSubsByJob } from "@/lib/recovery-snapshot";

type JobSubsState = Record<string, string[]>;
const DATA_FILE = "state/job-subs.json";

async function readState(): Promise<JobSubsState> {
  const parsed = await readJson<JobSubsState>(DATA_FILE, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ subIds: [] as string[] });

  const state = await readState();
  const subIds = Array.isArray(state[jobId]) && state[jobId].length ? state[jobId] : (recoveryJobSubsByJob[jobId] || []);
  return NextResponse.json({ subIds });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const subIds = Array.isArray(body?.subIds) ? body.subIds.filter((x: unknown) => typeof x === "string") : [];

    if (!jobId) return NextResponse.json({ ok: false }, { status: 400 });

    const state = await readState();
    state[jobId] = subIds;

    await writeJson(DATA_FILE, state);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
