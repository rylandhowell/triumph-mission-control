import { get, put } from "@vercel/blob";
import { readJson, writeJson } from "@/lib/blob-state";

export type TakeoffJobStatus = "queued" | "processing" | "done" | "failed";

export type TakeoffJob = {
  id: string;
  status: TakeoffJobStatus;
  fileUrls: string[];
  heatedSqft: number | null;
  underRoofSqft: number | null;
  result?: any;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

type QueueState = { jobs: TakeoffJob[] };

const PATH = "state/estimator-takeoff-jobs.json";

export async function readQueue(): Promise<QueueState> {
  return readJson<QueueState>(PATH, { jobs: [] });
}

export async function writeQueue(state: QueueState) {
  await writeJson(PATH, state);
}

export async function downloadFileBuffers(fileUrls: string[]) {
  const out: ArrayBuffer[] = [];
  for (const url of fileUrls) {
    const r = await get(url, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) throw new Error(`Missing blob: ${url}`);
    out.push(await new Response(r.stream).arrayBuffer());
  }
  return out;
}

export async function uploadJobFiles(jobId: string, files: File[]) {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `estimator/takeoff/${jobId}/${i + 1}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const saved = await put(path, await file.arrayBuffer(), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: file.type || "application/pdf",
    });
    urls.push(saved.pathname);
  }
  return urls;
}
