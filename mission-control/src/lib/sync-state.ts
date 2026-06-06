// Cloud sync using Vercel Blob (already configured)
import { readJson, writeJson } from "./blob-state";

export async function syncToCloud(key: string, data: any) {
  await writeJson(`state/${key}.json`, data);
}

export async function syncFromCloud(key: string, defaultValue: any = null) {
  return await readJson(`state/${key}.json`, defaultValue);
}
