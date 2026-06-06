import { get, put } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOCAL_STATE_DIR = join(process.cwd(), "state");
const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

function localPath(pathname: string): string {
  return pathname.startsWith("state/") ? pathname.slice("state/".length) : pathname;
}

async function readTextLocal(pathname: string): Promise<string | null> {
  try {
    return await readFile(join(LOCAL_STATE_DIR, localPath(pathname)), "utf8");
  } catch {
    return null;
  }
}

async function readTextBlob(pathname: string): Promise<string | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return await new Response(res.stream).text();
}

async function readText(pathname: string): Promise<string | null> {
  if (hasBlobToken) {
    try {
      return await readTextBlob(pathname);
    } catch {
      return await readTextLocal(pathname);
    }
  }
  return await readTextLocal(pathname);
}

export async function readJson<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const raw = await readText(pathname);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonLocal(pathname: string, value: unknown): Promise<void> {
  const target = join(LOCAL_STATE_DIR, localPath(pathname));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(value, null, 2));
}

async function writeJsonBlob(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function writeJson(pathname: string, value: unknown): Promise<void> {
  if (hasBlobToken) {
    try {
      await writeJsonBlob(pathname, value);
      try {
        await writeJsonLocal(pathname, value);
      } catch {
        // Vercel's production filesystem is read-only. Blob is the source of truth there.
      }
      return;
    } catch (err) {
      if (process.env.VERCEL) throw err;
      // Fall back to local only in development.
    }
  }
  await writeJsonLocal(pathname, value);
}
