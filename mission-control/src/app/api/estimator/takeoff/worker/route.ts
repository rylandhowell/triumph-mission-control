import { NextResponse } from "next/server";
import { downloadFileBuffers, readQueue, writeQueue } from "@/lib/estimator-queue";
import { runTakeoffFromBuffers } from "@/lib/estimator-takeoff";

export async function POST() {
  const state = await readQueue();
  const idx = state.jobs.findIndex((j) => j.status === "queued");
  if (idx < 0) return NextResponse.json({ ok: true, message: "No queued jobs" });

  const job = state.jobs[idx];
  job.status = "processing";
  job.updatedAt = new Date().toISOString();
  await writeQueue(state);

  try {
    const buffers = await downloadFileBuffers(job.fileUrls);
    const result = await runTakeoffFromBuffers(buffers, job.heatedSqft, job.underRoofSqft);

    const fresh = await readQueue();
    const j = fresh.jobs.find((x) => x.id === job.id);
    if (!j) return NextResponse.json({ ok: false, error: "Job vanished" }, { status: 500 });

    j.status = "done";
    j.result = result;
    j.error = null;
    j.updatedAt = new Date().toISOString();
    await writeQueue(fresh);

    return NextResponse.json({ ok: true, processedJobId: job.id });
  } catch (e) {
    const fresh = await readQueue();
    const j = fresh.jobs.find((x) => x.id === job.id);
    if (j) {
      j.status = "failed";
      j.error = String(e);
      j.updatedAt = new Date().toISOString();
      await writeQueue(fresh);
    }
    return NextResponse.json({ ok: false, error: "Worker failed" }, { status: 500 });
  }
}
