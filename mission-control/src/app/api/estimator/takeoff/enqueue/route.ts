import { NextResponse } from "next/server";
import { readQueue, uploadJobFiles, writeQueue } from "@/lib/estimator-queue";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    const heatedSqftRaw = form.get("heatedSqft");
    const underRoofSqftRaw = form.get("underRoofSqft");

    if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const heatedSqft = typeof heatedSqftRaw === "string" ? Number(heatedSqftRaw) : null;
    const underRoofSqft = typeof underRoofSqftRaw === "string" ? Number(underRoofSqftRaw) : null;

    const id = `takeoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fileUrls = await uploadJobFiles(id, files);

    const state = await readQueue();
    const now = new Date().toISOString();
    state.jobs.unshift({
      id,
      status: "queued",
      fileUrls,
      heatedSqft: Number.isFinite(heatedSqft) ? heatedSqft : null,
      underRoofSqft: Number.isFinite(underRoofSqft) ? underRoofSqft : null,
      createdAt: now,
      updatedAt: now,
    });
    await writeQueue(state);

    return NextResponse.json({ ok: true, jobId: id, status: "queued" });
  } catch {
    return NextResponse.json({ error: "Failed to enqueue takeoff" }, { status: 500 });
  }
}
