import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/blob-state";

type HousePlan = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  sizeBytes?: number;
};

type HousePlansState = Record<string, HousePlan[]>;
const DATA_FILE = "state/job-houseplans.json";

async function readState(): Promise<HousePlansState> {
  const parsed = await readJson<HousePlansState>(DATA_FILE, {});
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId") || "";
  if (!jobId) return NextResponse.json({ plans: [] as HousePlan[] });

  const state = await readState();
  const plans = Array.isArray(state[jobId]) ? state[jobId] : [];
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId : "";
    const plans = Array.isArray(body?.plans) ? body.plans : [];
    if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });

    const cleanPlans: HousePlan[] = plans
      .filter((p: unknown) => p && typeof p === "object")
      .map((p: any) => ({
        id: String(p.id || ""),
        name: String(p.name || "Untitled plan"),
        url: String(p.url || ""),
        uploadedAt: String(p.uploadedAt || new Date().toISOString()),
        sizeBytes: typeof p.sizeBytes === "number" ? p.sizeBytes : undefined,
      }))
      .filter((p: HousePlan) => p.id && p.url);

    const state = await readState();
    state[jobId] = cleanPlans;
    await writeJson(DATA_FILE, state);

    return NextResponse.json({ ok: true, count: cleanPlans.length });
  } catch (err) {
    console.error("[JOB-HOUSEPLANS] Save failed:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
