import { get, put } from "@vercel/blob";

async function readText(pathname: string): Promise<string | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return await new Response(res.stream).text();
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

export async function writeJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
