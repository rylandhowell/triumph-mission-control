import { NextResponse } from "next/server";
import { runTakeoffFromBuffers } from "@/lib/estimator-takeoff";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((v): v is File => v instanceof File);
    const heatedSqftRaw = form.get("heatedSqft");
    const underRoofSqftRaw = form.get("underRoofSqft");

    const heatedSqft = typeof heatedSqftRaw === "string" ? Number(heatedSqftRaw) : null;
    const underRoofSqft = typeof underRoofSqftRaw === "string" ? Number(underRoofSqftRaw) : null;

    if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    const result = await runTakeoffFromBuffers(buffers, heatedSqft, underRoofSqft);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to process plan files" }, { status: 500 });
  }
}
